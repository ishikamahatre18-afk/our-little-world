import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'> & { photoUrl?: string };
const AccountContext = createContext<{user: User|null; loading:boolean}>({user:null,loading:true});
export function AccountProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<User|null>(null);
  const [loading,setLoading]=useState(true);
  const router=useRouter();
  const cache=useQueryClient();
  useEffect(()=>{
    let active=true;
    const refresh=()=>{supabase.auth.getUser().then(({data})=>{if(active){setUser(data.user);setLoading(false);}}).catch(()=>{if(active){setUser(null);setLoading(false);}});};
    const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{
      if(event!=='SIGNED_IN'&&event!=='SIGNED_OUT'&&event!=='USER_UPDATED'&&event!=='PASSWORD_RECOVERY')return;
      if(event==='SIGNED_OUT'){setUser(null);cache.clear();}else {queueMicrotask(refresh);cache.invalidateQueries();}
      router.invalidate();
    });
    refresh();
    return ()=>{active=false;subscription.unsubscribe();};
  },[router,cache]);
  return <AccountContext.Provider value={{user,loading}}>{children}</AccountContext.Provider>;
}
export const useAccount=()=>useContext(AccountContext);
async function withPhoto(profile:Tables<'profiles'>):Promise<Profile> {
  if(!profile.photo_path)return profile;
  const {data,error}=await supabase.storage.from('profile-photos').createSignedUrl(profile.photo_path,3600);
  if(error)throw error;
  return {...profile,photoUrl:data.signedUrl};
}
export function useWorld() {
  const {user,loading}=useAccount();
  const query=useQuery({queryKey:['world',user?.id],enabled:!!user&&!loading,staleTime:30000,queryFn:async()=>{
    if(!user)throw new Error('Sign in first');
    const [profiles,members,relationships,invitations]=await Promise.all([
      supabase.from('profiles').select('*'),supabase.from('relationship_members').select('*'),supabase.from('relationships').select('*'),supabase.from('partner_invitations').select('*').in('status',['open','pending']).order('created_at',{ascending:false})
    ]);
    for(const result of [profiles,members,relationships,invitations])if(result.error)throw result.error;
    const enriched=await Promise.all((profiles.data??[]).map(withPhoto));
    const membership=members.data?.find(member=>member.user_id===user.id);
    const relationship=relationships.data?.find(row=>row.id===membership?.relationship_id);
    const partnerId=members.data?.find(member=>member.relationship_id===relationship?.id&&member.user_id!==user.id)?.user_id;
    return {profile:enriched.find(row=>row.id===user.id),partner:enriched.find(row=>row.id===partnerId),relationship,invitations:(invitations.data??[]).filter(row=>new Date(row.expires_at)>new Date())};
  }});
  return {...query,user,accountLoading:loading};
}
