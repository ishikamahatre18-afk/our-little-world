import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Heart, Sparkles, Home, LayoutGrid, Camera, UserRound, Flower2, Mail, LockKeyhole, Eye, EyeOff, CalendarHeart, ChevronRight, Copy, Check, Plus, X, ImagePlus, ShieldCheck, LogIn, Send, Music2, Coffee, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import hearts from '@/assets/together-hearts.jpg';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAccount, useWorld, type Profile } from './account-context';
import { relationshipDates } from '@/lib/relationship-dates';
import { INVITE_CODE_LENGTH, INVITE_CODE_PATTERN, isValidInviteCode, normalizeInviteCode } from '@/lib/invite-code';

function Avatar({profile,partner=false}:{profile?:Profile|undefined;partner?:boolean}) {
  return <span className={`avatar ${partner?'avatar-partner':'avatar-you'}`}>{profile?.photoUrl?<img src={profile.photoUrl} alt={profile.name}/>:profile?.name?.slice(0,1)||<UserRound size={23}/>}</span>;
}
function AccountPrompt() { return <div className="empty-state"><Heart size={25}/><h3>Your story starts with you.</h3><p>Log in to save your profile and invite your partner.</p><Button variant="romantic" size="roomy" asChild><Link to="/login">Log in <ArrowRight size={16}/></Link></Button><Link to="/signup" className="preview-link">Create an account</Link></div>; }
function WorldStatus({world}:{world:ReturnType<typeof useWorld>}) {
  if(world.accountLoading||world.isPending&&world.user)return <p className="preview-notice">Opening your little world…</p>;
  if(world.error)return <div className="form-notice" role="alert">We couldn’t load your details. <Button variant="link" onClick={()=>world.refetch()}>Try again</Button></div>;
  return null;
}


export function pageHead(title: string, description: string) {
  return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}

const navigation = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/our-space', label: 'Our Space', icon: Heart },
  { to: '/activities', label: 'Activities', icon: LayoutGrid },
  { to: '/memories', label: 'Memories', icon: Camera },
  { to: '/profile', label: 'Profile', icon: UserRound },
] as const;

export function Brand() {
  return <Link to="/" className="brand"><span className="brand-mark"><Heart size={19} strokeWidth={1.5} /></span><span>between us<span className="brand-dot">.</span></span></Link>;
}

export function Welcome() {
  return <main className="welcome"><header className="welcome-header"><Brand /><span className="welcome-note"><LockKeyhole size={13} /> A little world for two</span></header>
    <section className="welcome-main"><div className="welcome-intro"><span className="eyebrow"><span className="little-line" /> TWO HEARTS. ONE LITTLE WORLD.<span className="little-line" /></span><h1>Between Us<span className="heading-heart">♡</span></h1><p className="welcome-tagline">Our Little World, Just You &amp; Me.</p></div>
      <div className="welcome-art"><img src={hearts} width={1024} height={1024} alt="Two intertwined blush and lavender glass hearts on silk" /><span className="art-note">a place for your kind of love</span></div>
      <div className="welcome-bottom"><p>For the little moments.<br />And the love that makes them everything.</p><Button variant="romantic" size="roomy" asChild><Link to="/signup">Get Started <ArrowRight size={17} /></Link></Button><div className="login-prompt">Already part of our world? <Link to="/login">Log in</Link></div><Link to="/home" className="preview-link">Take a little look around <ArrowRight size={13} /></Link></div>
    </section><footer className="welcome-footer"><Heart size={12} /> Made for just the two of you</footer></main>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const {user}=useAccount();
  const pathname = useRouterState({ select: state => state.location.pathname });
  return <div className="app-shell"><header className="app-header"><Brand /><div className="header-right"><span className="demo-label">{user?'Your little world':'Welcome, love'}</span><Button variant="ghost" size="icon" asChild aria-label="Your profile"><Link to="/profile"><UserRound size={18} /></Link></Button></div></header>
    <aside className="desktop-navigation"><span className="eyebrow">OUR LITTLE WORLD</span>{navigation.map(({to,label,icon:Icon}) => <Button asChild variant="nav" key={to} className={pathname===to?'is-active':''}><Link to={to}><Icon size={19}/>{label}</Link></Button>)}<div className="sidebar-note"><img src={hearts} alt="Intertwined hearts" width={1024} height={1024} loading="lazy"/><p>Better, together.</p><span>Always a little closer.</span></div></aside>
    <main className="app-content">{children}</main><nav className="bottom-navigation" aria-label="Main navigation">{navigation.map(({to,label,icon:Icon}) => <Button asChild variant="nav" key={to} className={pathname===to?'is-active':''}><Link to={to} aria-current={pathname===to?'page':undefined}><Icon size={20} strokeWidth={1.6}/><span>{label}</span></Link></Button>)}</nav></div>;
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

function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
  return <div className="modal-backdrop" onClick={onClose}><section className="romantic-modal" role="dialog" aria-modal="true" aria-label={title} onClick={event=>event.stopPropagation()}><div className="modal-heading"><h2>{title}</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog"><X size={20}/></Button></div>{children}</section></div>;
}

export function HomeScreen() {
  const [question,setQuestion]=useState(false);
  const world=useWorld();
  const [today,setToday]=useState<Date>();
  useEffect(()=>{setToday(new Date());const timer=setInterval(()=>setToday(new Date()),60000);return()=>clearInterval(timer);},[]);
  const {profile,partner,relationship}=world.data||{};
  const anniversary=relationship?.anniversary||profile?.anniversary;
  const dates=anniversary&&today?relationshipDates(anniversary,today):undefined;
  return <AppShell><div className="page-heading"><div><span className="eyebrow">OUR LITTLE WORLD</span><h1>Home is <em>with you.</em></h1><p>A little love, a little closer, every day.</p></div><span className="heading-flower"><Flower2 size={35} strokeWidth={1}/></span></div><WorldStatus world={world}/><section className="couple-band">{!world.accountLoading&&!world.user?<AccountPrompt/>:world.data&&<><div className="couple-avatars"><Avatar profile={profile}/><span className="avatar-heart"><Heart size={15} fill="currentColor"/></span><Avatar profile={partner} partner/></div><h2>{profile?.name||'Your story'} <span>&</span> {partner?.name||'Your other half'}</h2><span className="example-caption">{relationship?'YOUR CONNECTION, VERIFIED':'NO PARTNER CONNECTED YET'}</span>{dates?<div className="relationship-stats"><div><strong>{dates.daysTogether}<span>days</span></strong><p>of choosing each other</p></div><span className="stat-divider"/><div><strong>{dates.daysUntil}<span>days</span></strong><p>{dates.daysUntil===0?'your anniversary is today':'until your anniversary'}</p></div></div>:<p className="preview-notice">Save your anniversary to begin your story.</p>}{!relationship&&<Link to={profile?.name?'/connect':'/setup'} className="preview-link">{profile?.name?'Invite your partner':'Set up your profile'} <ArrowRight size={14}/></Link>}<span className="couple-since"><Heart size={11}/> A love worth celebrating</span></>}</section><div className="home-grid"><section className="quote-section"><span className="eyebrow"><Sparkles size={13}/> A LITTLE LOVE NOTE</span><blockquote>“In a world full of people,<br/>my heart still chooses you.”</blockquote><span className="quote-bottom">TODAY & EVERY DAY <Heart size={13}/></span></section><section className="question-card"><div className="question-top"><span className="icon-tile"><Coffee size={21}/></span><span className="small-label">A MOMENT FOR US</span><span className="question-number">01</span></div><h2>What little thing do I do<br/>that makes you feel loved?</h2><div className="question-bottom"><span>Today’s question</span><Button variant="soft" onClick={()=>setQuestion(true)}>Let’s talk <ArrowRight size={14}/></Button></div></section></div><div className="section-heading"><h2>Little things, big feelings.</h2><Heart size={16}/></div><div className="quick-grid"><Link to="/our-space" className="quick-card letter-card"><span className="quick-icon"><Mail size={26} strokeWidth={1.2}/></span><div><h3>Love letters</h3><p>Words from the heart</p></div><ArrowRight size={18}/></Link><Link to="/memories" className="quick-card memory-card"><span className="quick-icon"><Camera size={26} strokeWidth={1.2}/></span><div><h3>Our memories</h3><p>Moments to keep forever</p></div><ArrowRight size={18}/></Link></div><p className="home-footnote">Just us. Just love. <Heart size={11}/></p>{question&&<Modal title="A moment for us" onClose={()=>setQuestion(false)}><p className="modal-question">What little thing do I do that makes you feel loved?</p><textarea aria-label="Your answer" placeholder="It’s the little things…" rows={5}/><p className="preview-notice">Preview only · answers aren’t saved or shared.</p><Button variant="romantic" size="roomy" onClick={()=>setQuestion(false)}>Back to our world <Heart size={16}/></Button></Modal>}</AppShell>;
}

export function SpaceScreen() {
  const [letter,setLetter]=useState(false);
  return <AppShell><PageHeading eyebrow="JUST YOU & ME" title="Our space." subtitle="A place for everything we feel."/><section className="space-feature"><Mail size={40} strokeWidth={1}/><span className="eyebrow">WORDS FROM THE HEART</span><h2>Some things are better<br/>written with love.</h2><Button variant="romantic" size="roomy" onClick={()=>setLetter(true)}>Preview a love letter <Plus size={16}/></Button></section><div className="section-heading"><h2>Our letters</h2><span className="small-label">0 LETTERS</span></div><div className="empty-state"><Heart size={25} strokeWidth={1}/><h3>The first page is yours.</h3><p>Your saved letters will live here.<br/>Letter saving is coming in the next stage.</p></div>{letter&&<Modal title="Dear you," onClose={()=>setLetter(false)}><input className="letter-title" aria-label="Letter title" placeholder="A little note for you…"/><textarea aria-label="Love letter" placeholder="If I could tell you one thing today…" rows={7}/><p className="preview-notice">Writing preview · this letter won’t be saved or sent.</p><Button variant="romantic" size="roomy" onClick={()=>setLetter(false)}>Close preview <Heart size={16}/></Button></Modal>}</AppShell>;
}

export function PageHeading({eyebrow,title,subtitle}:{eyebrow:string;title:string;subtitle:string}) { return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div><Flower2 size={30} strokeWidth={1} className="heading-flower"/></div>; }

export function ActivitiesScreen() {
  const [selected,setSelected]=useState<string>();
  const ideas=[{icon:Coffee,title:'A slow morning together',detail:'Make your favourite drinks. Put your phones away. Ask each other what a perfect day would look like.',label:'QUALITY TIME'},{icon:Music2,title:'The soundtrack of us',detail:'Pick three songs that remind you of each other and take turns sharing the story behind each one.',label:'LITTLE RITUALS'},{icon:Heart,title:'Three things I love',detail:'Tell your partner three small things you noticed and appreciated about them this week.',label:'A LITTLE CLOSER'}];
  return <AppShell><PageHeading eyebrow="MAKE TIME FOR US" title="Closer, together." subtitle="Little ways to turn a day into a memory."/><div className="activity-list">{ideas.map(({icon:Icon,title,detail,label})=><section className="activity-item" key={title}><span className="icon-tile"><Icon size={24} strokeWidth={1.3}/></span><div><span className="small-label">{label}</span><h2>{title}</h2><p>{detail}</p><Button variant="link" onClick={()=>setSelected(title)}>Make a little moment <ArrowRight size={14}/></Button></div></section>)}</div>{selected&&<Modal title={selected} onClose={()=>setSelected(undefined)}><p className="modal-question">{ideas.find(idea=>idea.title===selected)?.detail}</p><p className="preview-notice">Enjoy this idea together. Activity tracking isn’t connected yet.</p><Button variant="romantic" size="roomy" onClick={()=>setSelected(undefined)}>Sounds lovely <Heart size={16}/></Button></Modal>}</AppShell>;
}

export function MemoriesScreen() {
  const [notice,setNotice]=useState(false);
  return <AppShell><PageHeading eyebrow="THE MOMENTS THAT MATTER" title="Our memories." subtitle="Because the little things are the big things."/><section className="memories-empty"><div className="memory-illustration"><Camera size={60} strokeWidth={0.9}/><Heart size={22} className="memory-heart"/></div><h2>A thousand little moments.<br/>One beautiful story.</h2><p>Your photos and shared memories<br/>will have a home here.</p><Button variant="romantic" size="roomy" onClick={()=>setNotice(true)}><ImagePlus size={17}/> Add our first memory</Button>{notice&&<p className="form-notice" role="status">Memory saving hasn’t been implemented yet. No memory has been added.</p>}<span className="small-label">MEMORY UPLOADS · COMING NEXT</span></section></AppShell>;
}

export function ProfileScreen() {
  const world=useWorld();const cache=useQueryClient();const navigate=useNavigate();const [notice,setNotice]=useState('');
  const signout=useMutation({mutationFn:async()=>{await cache.cancelQueries();cache.clear();const {error}=await supabase.auth.signOut();if(error)throw error;await navigate({to:'/login',replace:true});},onError:error=>setNotice(error.message)});
  return <AppShell><PageHeading eyebrow="YOUR LITTLE CORNER" title="Hello, you." subtitle="A little about you. A lot about us."/><WorldStatus world={world}/>{!world.accountLoading&&!world.user?<AccountPrompt/>:world.user&&<><section className="profile-summary"><Avatar profile={world.data?.profile}/><h2>{world.data?.profile?.name||'Make yourself at home'}</h2><span className="demo-label">Your profile</span></section><div className="profile-menu"><Link to="/setup"><span className="icon-tile"><UserRound size={19}/></span><div><strong>Your profile</strong><span>Name, photo & special dates</span></div><ChevronRight size={17}/></Link><Link to="/connect"><span className="icon-tile"><Heart size={19}/></span><div><strong>Your partner</strong><span>{world.data?.partner?.name||'No partner connected yet'}</span></div><ChevronRight size={17}/></Link></div><div className="privacy-note"><ShieldCheck size={21}/><h3>A world that’s only yours.</h3><p>Your profile is visible only to you<br/>and your verified partner.</p></div><Button variant="outline" size="roomy" onClick={()=>signout.mutate()} disabled={signout.isPending}>Log out <LogIn size={16}/></Button>{notice&&<p className="form-notice" role="status">{notice}</p>}</>}<Link to="/" className="preview-link">Back to welcome <ArrowRight size={14}/></Link></AppShell>;
}
