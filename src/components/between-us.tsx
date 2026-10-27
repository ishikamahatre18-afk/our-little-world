import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Heart, Sparkles, Home, LayoutGrid, Camera, UserRound, Flower2, Mail, LockKeyhole, Eye, EyeOff, CalendarHeart, ChevronRight, Copy, Check, Plus, X, ImagePlus, ShieldCheck, LogIn, Send, Music2, Coffee, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import hearts from '@/assets/together-hearts.jpg';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAccount, useWorld } from './account-context';
import { AccountPrompt, AppShell, Avatar, Brand, PageHeading, WorldStatus } from '@/features/shell';
import { relationshipDates } from '@/lib/relationship-dates';
import { INVITE_CODE_LENGTH, INVITE_CODE_PATTERN, isValidInviteCode, normalizeInviteCode } from '@/lib/invite-code';



export function pageHead(title: string, description: string) {
  return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}



export function Welcome() {
  return <main className="welcome"><header className="welcome-header"><Brand /><span className="welcome-note"><LockKeyhole size={13} /> A little world for two</span></header>
    <section className="welcome-main"><div className="welcome-intro"><span className="eyebrow"><span className="little-line" /> TWO HEARTS. ONE LITTLE WORLD.<span className="little-line" /></span><h1>Between Us<span className="heading-heart">♡</span></h1><p className="welcome-tagline">Our Little World, Just You &amp; Me.</p></div>
      <div className="welcome-art"><img src={hearts} width={1024} height={1024} alt="Two intertwined blush and lavender glass hearts on silk" /><span className="art-note">a place for your kind of love</span></div>
      <div className="welcome-bottom"><p>For the little moments.<br />And the love that makes them everything.</p><Button variant="romantic" size="roomy" asChild><Link to="/signup">Get Started <ArrowRight size={17} /></Link></Button><div className="login-prompt">Already part of our world? <Link to="/login">Log in</Link></div><Link to="/home" className="preview-link">Take a little look around <ArrowRight size={13} /></Link></div>
    </section><footer className="welcome-footer"><Heart size={12} /> Made for just the two of you</footer></main>;
}

function FormShell({ children, title, subtitle, step }: { children: ReactNode; title: string; subtitle: string; step?: string }) {
  return <main className="form-page"><header className="form-header"><Brand /><Button variant="ghost" size="icon" asChild aria-label="Back to welcome"><Link to="/"><X size={20}/></Link></Button></header><section className="form-content"><Button variant="ghost" size="icon" asChild aria-label="Back"><Link to="/"><ArrowLeft size={19}/></Link></Button>{step && <span className="eyebrow step-label">{step}</span>}<div className="form-symbol"><Heart size={27} strokeWidth={1.3}/></div><h1>{title}</h1><p className="page-subtitle">{subtitle}</p>{children}</section><footer className="form-footer"><LockKeyhole size={12}/> Your love deserves a little privacy.</footer></main>;
}

export function AuthScreen({ mode }: { mode: 'signup'|'login'|'forgot'|'reset' }) {
  const [visible,setVisible]=useState(false);
  const [notice,setNotice]=useState('');
  const [recovery,setRecovery]=useState(false);
  const navigate=useNavigate();
  const {user}=useAccount();
  const signup=mode==='signup', forgot=mode==='forgot', reset=mode==='reset';
  useEffect(()=>{setRecovery(window.location.hash.includes('type=recovery')||window.location.search.includes('type=recovery'));},[]);
  const mutation=useMutation({mutationFn:async(form:HTMLFormElement)=>{
    const values=new FormData(form); const email=String(values.get('email')||'').trim(); const password=String(values.get('password')||'');
    if(reset){if(!recovery)throw new Error('Open the password reset link from your email first.'); const {error}=await supabase.auth.updateUser({password});if(error)throw error;setNotice('Password updated. You can now log in.');return;}
    if(forgot){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/reset-password'});if(error)throw error;setNotice('If an account exists, check your email for a reset link.');return;}
    if(signup){const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}});if(error)throw error;if(!data.session){setNotice('Check your email to confirm your account, then log in.');return;}}
    else {const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;}
    await navigate({to:signup?'/setup':'/home'});
  },onError:error=>setNotice(error.message)});
  const title=signup?'Your story starts here.':forgot?'A little help getting in.':reset?'A fresh start.':'Hello again, love.';
  return <FormShell title={title} subtitle={signup?'Make a little space for your big love.':forgot?'Let’s find your way back to your little world.':reset?'Choose a new password for your little world.':'Your little world has missed you.'}>{user&&!forgot&&!reset?<><p className="preview-notice">You’re already signed in.</p><Button variant="romantic" size="roomy" asChild><Link to="/home">Open your little world</Link></Button></>:<><form className="romantic-form" onSubmit={event=>{event.preventDefault();setNotice('');mutation.mutate(event.currentTarget);}}>{!reset&&<label>Email address<div className="input-wrap"><Mail size={17}/><input name="email" type="email" placeholder="you@example.com" autoComplete="email" required/></div></label>}{!forgot&&<label>{reset?'New password':'Password'}<div className="input-wrap"><LockKeyhole size={17}/><input name="password" type={visible?'text':'password'} placeholder={signup?'At least 8 characters':'Enter your password'} minLength={8} autoComplete={signup||reset?'new-password':'current-password'} required/><Button type="button" variant="ghost" size="icon" onClick={()=>setVisible(!visible)} aria-label={visible?'Hide password':'Show password'}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</Button></div></label>}{mode==='login'&&<Link to="/forgot-password" className="forgot-link">Forgot password?</Link>}{notice&&<p className="form-notice" role="status">{notice}</p>}<Button type="submit" variant="romantic" size="roomy" disabled={mutation.isPending}>{mutation.isPending?'A little moment…':signup?'Create our little world':forgot?'Send reset link':reset?'Update password':'Log in'}<ArrowRight size={17}/></Button></form>{!forgot&&!reset&&<><div className="form-divider"><span>or</span></div><Button variant="outline" size="roomy" className="google-button" onClick={async()=>{const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});if(error)setNotice(error.message);}}><span className="google-letter">G</span> Continue with Google</Button><p className="switch-auth">{signup?'Already have a little world?':'New here?'} <Link to={signup?'/login':'/signup'}>{signup?'Log in':'Get started'}</Link></p></>}{forgot&&<Link to="/login" className="preview-link">Back to login</Link>}</>}</FormShell>;
}

export function ProfileSetup() {
  const world=useWorld(); const cache=useQueryClient(); const navigate=useNavigate();
  const [photo,setPhoto]=useState<string>(); const [file,setFile]=useState<File>(); const [notice,setNotice]=useState('');
  const [name,setName]=useState('');const [birthday,setBirthday]=useState('');const [anniversary,setAnniversary]=useState('');
  useEffect(()=>{if(world.data?.profile){setName(world.data.profile.name);setBirthday(world.data.profile.birthday||'');setAnniversary(world.data.relationship?.anniversary||world.data.profile.anniversary||'');}},[world.data]);
  useEffect(()=>()=>{if(photo)URL.revokeObjectURL(photo);},[photo]);
  const save=useMutation({mutationFn:async()=>{
    if(!world.user)throw new Error('Log in before saving your profile.');
    if(!name.trim())throw new Error('Please enter your name.');
    let path=world.data?.profile?.photo_path; let uploaded:string|undefined;
    if(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024)throw new Error('Choose a JPG, PNG, or WebP photo under 2 MB.');
      path=world.user.id+'/'+crypto.randomUUID()+'.'+(file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp');
      const result=await supabase.storage.from('profile-photos').upload(path,file);if(result.error)throw result.error;uploaded=path;
    }
    const {error}=await supabase.rpc('save_profile',{p_name:name.trim(),p_anniversary:anniversary,...(birthday?{p_birthday:birthday}:{}),...(path?{p_photo_path:path}:{})});
    if(error){if(uploaded)await supabase.storage.from('profile-photos').remove([uploaded]);throw error;}
    await cache.invalidateQueries({queryKey:['world']}); await navigate({to:world.data?.relationship?'/home':'/connect'});
  },onError:error=>setNotice(error.message)});
  return <FormShell title="A little about you." subtitle="The first page of your story together." step="01 / 02 · YOUR PROFILE"><WorldStatus world={world}/>{!world.accountLoading&&!world.user?<AccountPrompt/>:world.user&&<form className="romantic-form" onSubmit={event=>{event.preventDefault();save.mutate();}}><label className="photo-picker"><span className="photo-circle">{photo||world.data?.profile?.photoUrl?<img src={photo||world.data?.profile?.photoUrl} alt="Your selected profile"/>:<UserRound size={30} strokeWidth={1.2}/>}<span className="photo-add"><Plus size={13}/></span></span><span>Add your photo</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{const chosen=event.target.files?.[0];if(chosen){setFile(chosen);setPhoto(URL.createObjectURL(chosen));}}}/></label><label>Your name<div className="input-wrap"><UserRound size={17}/><input value={name} onChange={event=>setName(event.target.value)} placeholder="What should we call you?" required maxLength={40}/></div></label><label>Birthday <span className="optional">optional</span><div className="input-wrap"><CalendarDays size={17}/><input type="date" value={birthday} onChange={event=>setBirthday(event.target.value)}/></div></label><label>Your anniversary<div className="input-wrap"><CalendarHeart size={17}/><input type="date" value={anniversary} onChange={event=>setAnniversary(event.target.value)} required/></div></label>{world.data?.relationship&&<p className="preview-notice">Changing this date updates your shared anniversary.</p>}{notice&&<p className="form-notice" role="status">{notice}</p>}<Button variant="romantic" size="roomy" type="submit" disabled={save.isPending||world.isPending}>{save.isPending?'Saving your story…':world.data?.relationship?'Save your profile':'Save & continue'} <ArrowRight size={17}/></Button></form>}</FormShell>;
}

export function ConnectPartner() {
  const world=useWorld();const cache=useQueryClient();const navigate=useNavigate();
  const [tab,setTab]=useState<'invite'|'join'>('invite');const [notice,setNotice]=useState('');const [copied,setCopied]=useState(false);const [code,setCode]=useState('');
  const invitation=world.data?.invitations.find(row=>row.status==='pending')||world.data?.invitations.find(row=>row.owner_id===world.user?.id);
  const action=useMutation({mutationFn:async(kind:'create'|'join'|'accept'|'cancel')=>{
    if(kind==='join'&&!isValidInviteCode(code))throw new Error('Enter the 8-character code from your partner');
    const result=kind==='create'?await supabase.rpc('create_partner_invitation'):kind==='join'?await supabase.rpc('join_partner_invitation',{p_code:code}):invitation?await supabase.rpc('resolve_partner_invitation',{p_id:invitation.id,p_accept:kind==='accept'}):{error:new Error('Request not available')};
    if(result.error)throw result.error;if(kind==='join'&&'data' in result&&result.data!=='ok')throw new Error(String(result.data));await cache.invalidateQueries({queryKey:['world']});
    setNotice(kind==='join'?'Request sent. You are not connected until your partner approves.':kind==='cancel'?'Invitation cancelled.':'');
    if(kind==='accept')await navigate({to:'/connected'});
  },onError:error=>setNotice(error.message)});
  const ready=!!world.data?.profile?.name&&!!world.data.profile.anniversary;
  return <FormShell title={world.data?.relationship?'Together, at last.':'Find your other half.'} subtitle="One invitation. The beginning of your little world." step="02 / 02 · CONNECT TOGETHER"><WorldStatus world={world}/>{!world.accountLoading&&!world.user?<AccountPrompt/>:world.data?.relationship?<><p className="preview-notice"><ShieldCheck size={15}/> Your connection is verified.</p><Button variant="romantic" size="roomy" asChild><Link to="/home">Open our little world</Link></Button></>:world.user&&!world.isPending&&!ready?<><p className="preview-notice">Save your name and anniversary before inviting your partner.</p><Button variant="romantic" size="roomy" asChild><Link to="/setup">Complete your profile</Link></Button></>:ready&&<><div className="preview-notice"><ShieldCheck size={15}/> {invitation?.status==='pending'?'Awaiting approval · not connected':'No partner connected yet'}</div><div className="segmented"><Button variant="soft" className={tab==='invite'?'selected':''} onClick={()=>setTab('invite')}>Create an invitation</Button><Button variant="soft" className={tab==='join'?'selected':''} onClick={()=>setTab('join')}>Join with a code</Button></div>{invitation?.status==='pending'?<div className="invite-content"><h2>{invitation.owner_id===world.user?.id?'Your partner has requested to join.':'Waiting for your partner’s yes.'}</h2><p>Verify this request with your partner before approving.<br/>The shared anniversary will use the inviter’s saved date.</p>{invitation.owner_id===world.user?.id&&<Button variant="romantic" size="roomy" disabled={action.isPending} onClick={()=>action.mutate('accept')}>Accept & connect <Heart size={16}/></Button>}<Button variant="outline" disabled={action.isPending} onClick={()=>action.mutate('cancel')}>Cancel request</Button></div>:tab==='invite'?<div className="invite-content">{invitation?<><span className="eyebrow">YOUR PRIVATE INVITATION CODE</span><div className="invitation-code live-code">{invitation.code}</div><Button variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(invitation.code);setCopied(true);}catch{setNotice('Copy isn’t available. Select and copy the code above.');}}}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copied':'Copy invitation code'}</Button><p>Share only with your partner. Valid for 7 days.</p><Button variant="link" onClick={()=>action.mutate('cancel')} disabled={action.isPending}>Cancel invitation</Button></>:<Button variant="romantic" size="roomy" onClick={()=>action.mutate('create')} disabled={action.isPending}>{action.isPending?'Creating…':'Create invitation code'} <Plus size={16}/></Button>}</div>:<form className="romantic-form" onSubmit={event=>{event.preventDefault();action.mutate('join');}}><label>Your partner’s invitation code<div className="input-wrap"><Heart size={17}/><input required value={code} onChange={event=>setCode(normalizeInviteCode(event.target.value))} placeholder="Enter their invitation code" minLength={INVITE_CODE_LENGTH} maxLength={INVITE_CODE_LENGTH} pattern={INVITE_CODE_PATTERN} title="8 letters and numbers" autoCapitalize="characters" autoComplete="off" spellCheck={false}/></div></label><Button variant="romantic" size="roomy" type="submit" disabled={action.isPending}>Request to join <Send size={16}/></Button></form>}<div className="approval-note"><ShieldCheck size={21}/><div><strong>Two hearts, two yeses.</strong><p>Joining sends a request. Only approval creates your shared world.</p></div></div><Button variant="link" onClick={()=>world.refetch()}>Check for updates</Button></>}{notice&&<p className="form-notice" role="status">{notice}</p>}<Link to="/home" className="preview-link muted-link">Back to our world</Link></FormShell>;
}

export function Connected() {
  const world=useWorld();
  return <FormShell title={world.data?.relationship?'You. Me. Us.':'Not connected yet.'} subtitle={world.data?.relationship?'Your invitation has been accepted and verified.':'Both hearts need to say yes first.'}><WorldStatus world={world}/>{world.data?.relationship?<><img className="success-hearts" src={hearts} alt="Two intertwined hearts" width={1024} height={1024}/><Button variant="romantic" size="roomy" asChild><Link to="/home">Step into our little world <ArrowRight size={16}/></Link></Button></>:<Button variant="romantic" size="roomy" asChild><Link to="/connect">Connect with your partner</Link></Button>}</FormShell>;
}

export function ProfileScreen() {
  const world=useWorld();const cache=useQueryClient();const navigate=useNavigate();const [notice,setNotice]=useState('');
  const signout=useMutation({mutationFn:async()=>{await cache.cancelQueries();cache.clear();const {error}=await supabase.auth.signOut();if(error)throw error;await navigate({to:'/login',replace:true});},onError:error=>setNotice(error.message)});
  return <AppShell><PageHeading eyebrow="YOUR LITTLE CORNER" title="Hello, you." subtitle="A little about you. A lot about us."/><WorldStatus world={world}/>{!world.accountLoading&&!world.user?<AccountPrompt/>:world.user&&<><section className="profile-summary"><Avatar profile={world.data?.profile}/><h2>{world.data?.profile?.name||'Make yourself at home'}</h2><span className="demo-label">Your profile</span></section><div className="profile-menu"><Link to="/setup"><span className="icon-tile"><UserRound size={19}/></span><div><strong>Your profile</strong><span>Name, photo & special dates</span></div><ChevronRight size={17}/></Link><Link to="/connect"><span className="icon-tile"><Heart size={19}/></span><div><strong>Your partner</strong><span>{world.data?.partner?.name||'No partner connected yet'}</span></div><ChevronRight size={17}/></Link></div><div className="privacy-note"><ShieldCheck size={21}/><h3>A world that’s only yours.</h3><p>Your profile is visible only to you<br/>and your verified partner.</p></div><Button variant="outline" size="roomy" onClick={()=>signout.mutate()} disabled={signout.isPending}>Log out <LogIn size={16}/></Button>{notice&&<p className="form-notice" role="status">{notice}</p>}</>}<Link to="/" className="preview-link">Back to welcome <ArrowRight size={14}/></Link></AppShell>;
}


export { Brand, AppShell, PageHeading } from '@/features/shell';
export { HomeScreen, SpaceScreen, ActivitiesScreen, MemoriesScreen } from '@/features/screens';
