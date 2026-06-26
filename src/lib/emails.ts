// ─── Shared layout wrapper ───────────────────────────────────────────────────

const BRAND_INDIGO = '#3C3489'
const BRAND_NAVY   = '#26215C'
const BRAND_AMBER  = '#EF9F27'
const BRAND_LIGHT  = '#EEEDFE'
const BRAND_GREEN_BG = '#EAF3DE'
const BRAND_GREEN_BORDER = '#639922'

function layout(headerBg: string, heroHtml: string, bodyHtml: string, sigHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#F1EFE8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #D3D1C7;">
    <!-- amber top bar -->
    <div style="height:3px;background:${BRAND_AMBER};"></div>
    <!-- header -->
    <div style="background:${headerBg};padding:32px 40px 28px;">
      <!-- logo row -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:6px 10px;display:inline-flex;align-items:center;">
          <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-1px;">N</span>
          <span style="width:6px;height:6px;border-radius:50%;background:${BRAND_AMBER};display:inline-block;margin-left:2px;vertical-align:top;margin-top:3px;"></span>
        </div>
        <div>
          <div style="font-size:16px;font-weight:500;color:#ffffff;">Naggare</div>
          <div style="font-size:10px;color:#AFA9EC;letter-spacing:0.07em;text-transform:uppercase;">Hiring, Humanised</div>
        </div>
      </div>
      ${heroHtml}
    </div>
    <!-- body -->
    <div style="padding:32px 40px;">
      ${bodyHtml}
    </div>
    ${sigHtml}
    <!-- footer -->
    <div style="height:1px;background:#D3D1C7;"></div>
    <div style="padding:16px 32px;text-align:center;font-size:11px;color:#888780;line-height:1.6;">
      Naggare · Whiteglove Labs · Hyderabad<br/>
      <a href="https://naggare.com" style="color:#534AB7;text-decoration:none;">naggare.com</a>
      &nbsp;·&nbsp;<a href="https://naggare.com" style="color:#888780;text-decoration:none;">Unsubscribe</a>
      &nbsp;·&nbsp;<a href="https://naggare.com" style="color:#888780;text-decoration:none;">Privacy policy</a>
    </div>
  </div>
</body>
</html>`
}

function hero(line: string, sub: string): string {
  return `<div style="font-size:20px;font-weight:500;color:#ffffff;line-height:1.35;margin-bottom:6px;">${line}</div>
          <div style="font-size:12px;color:#AFA9EC;line-height:1.5;">${sub}</div>`
}

function letter(paragraphs: string[]): string {
  return paragraphs.map(p => `<p style="font-size:14px;color:#2C2C2A;line-height:1.8;margin:0 0 14px;">${p}</p>`).join('')
}

function infoBox(color: 'indigo'|'green'|'amber', label: string, content: string): string {
  const bg    = color === 'indigo' ? BRAND_LIGHT   : color === 'green' ? BRAND_GREEN_BG  : '#FAEEDA'
  const border= color === 'indigo' ? '#7F77DD'     : color === 'green' ? BRAND_GREEN_BORDER : BRAND_AMBER
  const lc    = color === 'indigo' ? '#534AB7'     : color === 'green' ? '#3B6D11'         : '#854F0B'
  return `<div style="background:${bg};border-left:3px solid ${border};border-radius:8px;padding:16px 20px;margin-bottom:20px;">
    <div style="font-size:10px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase;color:${lc};margin-bottom:8px;">${label}</div>
    <div style="font-size:13px;color:#26215C;line-height:1.6;">${content}</div>
  </div>`
}

function badge(color: 'indigo'|'amber', text: string): string {
  const bg  = color === 'indigo' ? BRAND_LIGHT : '#FAEEDA'
  const bc  = color === 'indigo' ? '#7F77DD'   : BRAND_AMBER
  const tc  = color === 'indigo' ? '#534AB7'   : '#854F0B'
  return `<div style="display:inline-block;background:${bg};border:1px solid ${bc};border-radius:20px;padding:5px 14px;font-size:12px;font-weight:500;color:${tc};margin-bottom:16px;">${text}</div>`
}

function cta(url: string, label: string, color: 'indigo'|'navy'): string {
  const bg = color === 'indigo' ? BRAND_INDIGO : BRAND_NAVY
  return `<div style="text-align:center;margin:0 0 14px;">
    <a href="${url}" style="display:inline-block;background:${bg};color:#ffffff;font-size:14px;font-weight:500;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">${label}</a>
  </div>`
}

function sig(_color: 'indigo'|'navy'): string {
  return `<div style="padding:20px 40px;background:#F1EFE8;border-top:1px solid #D3D1C7;">
    <div style="font-size:13px;font-weight:600;color:#26215C;">P. Rajnish Alexander</div>
    <div style="font-size:11px;color:#5F5E5A;margin-top:2px;">Founder, Naggare · Whiteglove Labs</div>
  </div>`
}

// ─── Candidate emails ─────────────────────────────────────────────────────────

export function emailCandidateWelcome(name: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `Welcome to Naggare, ${first} — Hiring, Humanised.`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero('Welcome to Naggare.', 'Hiring, Humanised.'),
      `${letter([
        `Hi ${first},`,
        `Welcome to Naggare. I'm P. Rajnish Alexander, Founder — and I'd like to personally welcome you here.`,
        `After two decades in Talent Acquisition, I've seen hiring from every angle. Naggare is built to give both sides of the table a faster, efficient and better experience — whether you're a candidate who doesn't want to be seen as just an application, or a Recruiter who is looking to find real talent, not just keyword matches. Naggare aims to bring those together for mutual benefit.`,
        `I wish you well — whatever side of the table you're on. As always, please send feedback directly through the platform. I personally do read every word.`,
      ])}
      ${infoBox('indigo', 'Next step',
        `<strong>Build your profile</strong> — it takes under 5 minutes and is the only thing standing between you and your next opportunity or your next great hire.<br/><br/>
         Be honest. Be human. That's what the other side is actually looking for.`
      )}
      ${cta('https://naggare.com', 'Go to Naggare', 'indigo')}`,
      sig('indigo')
    )
  }
}


export function emailRecruiterWelcome(name: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `Congratulations and welcome to Naggare, ${first}`,
    html: layout(
      `linear-gradient(135deg,${BRAND_NAVY} 0%,${BRAND_INDIGO} 100%)`,
      hero('High-quality signals.<br/>Before the first conversation.', 'Built by a recruiter, for recruiters — to give you your time back.'),
      `${letter([
        `Hi ${first},`,
        `Congratulations and welcome to Naggare. I'm P. Rajnish Alexander, Founder at Naggare — and I want to personally welcome you to a faster, better way to source candidates with confidence.`,
        `After 22 years in Talent Acquisition, I built Naggare because I lived through the toil — the endless resume stacks, the phone screens that lead nowhere, the hours lost before a single quality signal emerged. I wanted to change that without cutting corners on quality.`,
        `On Naggare, you get high quality signals from candidates who match the skills, persona, and non-negotiables you've set in your JD card — even before you make first contact. That means less time screening and more time on conversations that actually convert to hire.`,
        `I wish you well in your hiring goals. And as always — your feedback reaches me directly through the website. I personally oversee it.`,
        `Happy Hiring.`,
      ])}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px;">
        ${statBox('📄', 'JDs redesigned for better candidate response')}
        ${statBox('📶', 'High quality signals from every candidate')}
        ${statBox('🚀', 'Time to hire, faster')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
        ${statBox('📈', 'Higher conversion to hire')}
        ${statBox('📵', 'Less screening time for recruiters')}
      </div>
      ${infoBox('green', 'Where to start',
        `<strong>1. Post your first JD</strong> — build a role card with your non-negotiables and let matched candidates signal their interest before you reach out.<br/><br/>
         <strong>2. Browse candidate profiles</strong> — use Pass, Pursue, or Golden Buzzer to manage your pipeline without the noise.<br/><br/>
         <strong>3. Check your Monday Naggar Digest</strong> — a private weekly report of who engaged with your JDs.`
      )}
      ${cta('https://naggare.com', 'Go to my recruiter dashboard', 'navy')}
      <p style="font-size:12px;color:#888780;text-align:center;">Feedback? <a href="https://naggare.com" style="color:#534AB7;text-decoration:none;">Share it on the website</a> — Rajnish reads every word personally.</p>`,
      sig('navy')
    )
  }
}

function statBox(icon: string, label: string): string {
  return `<div style="background:#F1EFE8;border-radius:8px;padding:14px;text-align:center;">
    <div style="font-size:20px;margin-bottom:6px;">${icon}</div>
    <div style="font-size:11px;font-weight:500;color:#26215C;line-height:1.4;">${label}</div>
  </div>`
}

export function emailRecruiterOTP(): { subject: string; html: string } {
  return {
    subject: `Your Naggare verification code`,
    html: layout(
      `linear-gradient(135deg,${BRAND_NAVY} 0%,${BRAND_INDIGO} 100%)`,
      hero('Verify your email to start hiring smarter.', 'One code. One step. Then you\'re in.'),
      `${letter([`Hi there,`, `Here's your one-time code to verify your email and set up your Naggare recruiter account.`])}
      ${infoBox('green', 'Your verification code',
        `<div style="text-align:center;padding:12px 0;">
          <div style="font-size:36px;font-weight:700;color:#26215C;letter-spacing:10px;font-family:monospace;">{{.Token}}</div>
          <div style="font-size:11px;color:#888780;margin-top:8px;">Valid for 10 minutes · Single use only</div>
        </div>`
      )}
      ${infoBox('amber', 'Note', `If you didn't create a Naggare recruiter account, you can safely ignore this email.`)}`,
      `<div style="padding:12px 40px;text-align:center;font-size:12px;color:#888780;">
        Questions? Write to us at <a href="mailto:hello@naggare.com" style="color:#534AB7;text-decoration:none;">hello@naggare.com</a>
      </div>`
    )
  }
}

export function emailRecruiterJDPublished(recruiterName: string, role: string, company: string, location: string): { subject: string; html: string } {
  const first = recruiterName.split(' ')[0]
  return {
    subject: `Your JD is live — ${role}`,
    html: layout(
      `linear-gradient(135deg,${BRAND_NAVY} 0%,${BRAND_INDIGO} 100%)`,
      hero('Your JD is live.<br/>Candidates can now find you.', 'High quality signals are on their way.'),
      `${letter([
        `Hi ${first},`,
        `Your JD card for <strong>${role}</strong> is now live on Naggare. Candidates whose skills, persona, and experience match your non-negotiables will see it in their weekly digest and can express interest.`,
        `You won't be flooded with applications. On Naggare, every signal you receive is intentional — from a candidate who has reviewed your JD and chosen to pursue it. That's the quality difference.`,
        `We'll notify you every time a candidate expresses interest, and your full pipeline will be waiting in your Monday Naggar Digest.`,
        `Happy Hiring.`,
      ])}
      ${infoBox('green', 'Your JD at a glance',
        `<strong>Role:</strong> ${role}<br/><strong>Company:</strong> ${company}<br/><strong>Location:</strong> ${location}<br/><strong>Status:</strong> Live and accepting interest`
      )}
      ${cta('https://naggare.com', 'View my JD card', 'navy')}`,
      sig('navy')
    )
  }
}

export function emailRecruiterCandidateInterested(recruiterName: string, role: string, candidateName: string, candidateRole: string, candidateExp: string, skills: string): { subject: string; html: string } {
  const first = recruiterName.split(' ')[0]
  return {
    subject: `New signal — someone is interested in your ${role} JD`,
    html: layout(
      `linear-gradient(135deg,${BRAND_NAVY} 0%,${BRAND_INDIGO} 100%)`,
      hero('A candidate is interested<br/>in your JD.', 'A quality signal just came in.'),
      `${letter([
        `Hi ${first},`,
        `A candidate has expressed interest in your <strong>${role}</strong> role. This isn't a cold application — they've reviewed your JD card, matched against your non-negotiables, and chosen to pursue you. That's a quality signal.`,
        `Review their profile and decide — Pursue to create a Candidate &amp; JD match, or Pass to keep your pipeline clean. Your Golden Buzzer is there for the ones you really don't want to miss.`,
      ])}
      ${infoBox('green', 'Candidate signal received',
        `<strong>Name:</strong> ${candidateName}<br/><strong>Current role:</strong> ${candidateRole} · ${candidateExp}<br/><strong>Skills match:</strong> ${skills}<br/><strong>Signal:</strong> Pursue`
      )}
      ${cta('https://naggare.com', 'Review candidate profile', 'navy')}`,
      sig('navy')
    )
  }
}

export function emailRecruiterSuperPursued(recruiterName: string, candidateName: string, candidateRole: string, candidateExp: string, skills: string): { subject: string; html: string } {
  const first = recruiterName.split(' ')[0]
  return {
    subject: `${recruiterName.split(' ')[0]}, you have been Super Pursued by ${candidateName.split(' ')[0]}`,
    html: layout(
      `linear-gradient(135deg,${BRAND_NAVY} 0%,${BRAND_INDIGO} 100%)`,
      hero(`${first}, you have been Super Pursued.`, 'A candidate\'s strongest signal. Don\'t miss this one.'),
      `${badge('indigo', '★ Super Pursue received')}
      ${letter([
        `Hi ${first},`,
        `<strong>${candidateName}</strong> has used their monthly Super Pursue on you. On Naggare, every candidate gets one Super Pursue per month — they've spent it on you. That's intent at its clearest.`,
        `This is exactly the kind of high-quality signal Naggare is built to surface. Take a close look at their profile before deciding.`,
        `Happy Hiring.`,
      ])}
      ${infoBox('green', 'Super Pursue received from',
        `<strong>Name:</strong> ${candidateName}<br/><strong>Current role:</strong> ${candidateRole} · ${candidateExp}<br/><strong>Skills match:</strong> ${skills}<br/><strong>Signal:</strong> Super Pursue ★`
      )}
      ${cta('https://naggare.com', `Review ${candidateName.split(' ')[0]}'s profile`, 'navy')}`,
      sig('navy')
    )
  }
}

export function emailRecruiterDigest(recruiterName: string, weekOf: string, candidatesHtml: string): { subject: string; html: string } {
  const first = recruiterName.split(' ')[0]
  return {
    subject: `Your Monday Naggar Digest — ${weekOf}`,
    html: layout(
      `linear-gradient(135deg,${BRAND_NAVY} 0%,${BRAND_INDIGO} 100%)`,
      hero('Your Monday Naggar Digest.<br/>This week\'s candidate activity.', `Week of ${weekOf}`),
      `${letter([
        `Hi ${first},`,
        `Here's a summary of candidate activity on your JDs this week. Every signal here is intentional — a candidate who reviewed your role and chose to express interest.`,
      ])}
      ${infoBox('green', 'This week\'s signals', candidatesHtml)}
      ${cta('https://naggare.com', 'Review all candidates', 'navy')}
      <p style="font-size:12px;color:#888780;text-align:center;">You're receiving this as a Naggare recruiter. <a href="https://naggare.com" style="color:#534AB7;text-decoration:none;">Manage digest settings</a></p>`,
      ''
    )
  }
}

export function emailRecruiterMatch(recruiterName: string, candidateName: string, role: string, exp: string, skills: string): { subject: string; html: string } {
  const first = recruiterName.split(' ')[0]
  return {
    subject: `Candidate & JD is a match — ${candidateName.split(' ')[0]} for ${role}`,
    html: layout(
      `linear-gradient(135deg,${BRAND_NAVY} 0%,${BRAND_INDIGO} 100%)`,
      hero(`Candidate &amp; JD is a match, ${first}.`, 'This is what high quality hiring looks like.'),
      `${badge('amber', '🤝 Candidate & JD matched')}
      ${letter([
        `Hi ${first},`,
        `<strong>${candidateName}</strong> and your <strong>${role}</strong> JD are a match. Both sides expressed interest — Candidate &amp; JD matched on Naggare.`,
        `No cold outreach. No guessing. Two sides who chose each other. Now it's time to have that conversation.`,
        `Reach out to ${candidateName.split(' ')[0]} directly. They're expecting to hear from you.`,
        `Happy Hiring.`,
      ])}
      ${infoBox('green', 'Your match',
        `<strong>Candidate:</strong> ${candidateName}<br/><strong>Role:</strong> ${role}<br/><strong>Experience:</strong> ${exp} · ${skills}<br/><strong>Status:</strong> Candidate &amp; JD matched ✓`
      )}
      ${cta('https://naggare.com', 'View match details', 'navy')}`,
      sig('navy')
    )
  }
}

export function emailRecruiterJDDeleted(recruiterName: string, role: string, company: string): { subject: string; html: string } {
  const first = recruiterName.split(' ')[0]
  return {
    subject: `Your JD has been removed — ${role}`,
    html: layout(
      `linear-gradient(135deg,${BRAND_NAVY} 0%,${BRAND_INDIGO} 100%)`,
      hero('Your JD has been removed.', 'Closed intentionally. That\'s clean hiring.'),
      `${letter([
        `Hi ${first},`,
        `Your JD card for <strong>${role}</strong> at ${company} has been successfully deleted. Candidates will no longer see it and no new signals will come in for this role.`,
        `If the role has been filled — congratulations. If you need to repost or open a new JD, your dashboard is ready when you are.`,
        `Happy Hiring.`,
      ])}
      ${infoBox('amber', 'Ready to post your next role?',
        `Building a new JD card on Naggare takes just a few minutes. Your non-negotiables do the filtering for you.`
      )}
      ${cta('https://naggare.com', 'Post a new JD', 'navy')}`,
      sig('navy')
    )
  }
}

export function emailRecruiterAccountDeleted(recruiterName: string): { subject: string; html: string } {
  const first = recruiterName.split(' ')[0]
  return {
    subject: `Your Naggare account has been removed`,
    html: layout(
      `linear-gradient(135deg,${BRAND_NAVY} 0%,${BRAND_INDIGO} 100%)`,
      hero(`Your account has been removed.<br/>We wish you well, ${first}.`, 'Thank you for hiring on Naggare.'),
      `${letter([
        `Hi ${first},`,
        `Your Naggare recruiter account has been successfully deleted. All your JDs and data have been removed from our platform.`,
        `We hope Naggare brought a better quality of candidate signal to your hiring process. If it did, that's everything we set out to do. If it didn't, we'd genuinely love to know why.`,
        `The door is always open. If you ever need to hire again, your account can be rebuilt in minutes.`,
        `Wishing you well in all your future hiring.`,
      ])}
      ${infoBox('amber', 'Have feedback?',
        `Tell us what we could have done better. Rajnish reads every word personally at <a href="https://naggare.com" style="color:#854F0B;">naggare.com</a>.`
      )}`,
      sig('navy')
    )
  }
}

export function emailRecruiterJDExpiring(recruiterName: string, role: string, company: string, expiryDate: string, signalCount: number): { subject: string; html: string } {
  const first = recruiterName.split(' ')[0]
  return {
    subject: `Your JD expires in 3 days — ${role}`,
    html: layout(
      `linear-gradient(135deg,${BRAND_NAVY} 0%,${BRAND_INDIGO} 100%)`,
      hero('Your JD expires in 3 days.', 'Renew it or close it — your call.'),
      `${letter([
        `Hi ${first},`,
        `Your JD card for <strong>${role}</strong> at ${company} is set to expire on <strong>${expiryDate}</strong>. After that, it will no longer be visible to candidates.`,
        `If the role is still open, renew it in one click and keep the signals coming. If it's been filled or put on hold, let it close — a clean pipeline is a better pipeline.`,
        `Happy Hiring.`,
      ])}
      ${infoBox('amber', 'Before it expires',
        `<strong>Role:</strong> ${role}<br/><strong>Signals received:</strong> ${signalCount} candidate${signalCount === 1 ? '' : 's'} interested<br/><strong>Expires:</strong> ${expiryDate}`
      )}
      ${cta('https://naggare.com', 'Renew my JD', 'navy')}
      <p style="font-size:12px;color:#888780;text-align:center;">If the role is filled, <a href="https://naggare.com" style="color:#534AB7;text-decoration:none;">close it here</a> so candidates aren't left waiting.</p>`,
      sig('navy')
    )
  }
}

// ─── Complete your profile reminder ──────────────────────────────────────────

export function emailCandidateCompleteProfile(candidateName: string, email: string): { subject: string; html: string } {
  const first = candidateName.split(' ')[0]
  return {
    subject: `${first}, your Naggare profile is waiting to be completed`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero(`${first}, your profile is almost there.`, 'A complete profile gets seen by the right recruiters.'),
      `${letter([
        `Hi ${first},`,
        `You've started building your Naggare profile — which means you've already taken the first step. Now let's finish it.`,
        `A complete profile with your photo, career journey, prompts, and skills is what gets you noticed by recruiters who match your non-negotiables. An incomplete one stays invisible.`,
        `It takes under 5 minutes. And once it's live, the right roles will find you.`,
        `Happy job seeking!`,
      ])}
      ${infoBox('indigo', 'What to complete',
        `<strong>📸 Profile photo</strong> — puts a face to your name<br/><br/>
         <strong>💼 Career journey</strong> — your story in organisations<br/><br/>
         <strong>💬 Prompts</strong> — what makes you, you<br/><br/>
         <strong>🎯 Skills</strong> — what you bring to the table`
      )}
      ${cta('https://naggare.com/candidate/register', 'Complete my profile', 'indigo')}`,
      sig('indigo')
    )
  }
}

// ─── Profile completed email ──────────────────────────────────────────────────

export function emailCandidateProfileComplete(candidateName: string): { subject: string; html: string } {
  const first = candidateName.split(' ')[0]
  return {
    subject: `${first}, your Naggare profile is complete!`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero(`Your profile is live, ${first}.`, 'Recruiters who match your experience can now find you.'),
      `${letter([
        `Hi ${first},`,
        `Your Naggare profile is now complete and live. Recruiters whose roles match your skills, experience, and non-negotiables will be able to find you and express interest.`,
        `One recommendation — keep your profile current. As you hit new milestones, ship new products, or take on new responsibilities, update your experience section. A profile that reflects your latest achievements is always stronger.`,
        `The right role is out there. We'll make sure it finds you.`,
        `Happy job seeking!`,
      ])}
      ${infoBox('indigo', 'What happens next',
        `<strong>Browse JD cards</strong> — explore roles matched to your profile.<br/><br/>
         <strong>Use Super Pursue</strong> — once a month, go all-in on a recruiter you genuinely want to work with.<br/><br/>
         <strong>Watch your Monday digest</strong> — fresh matched JDs arrive every week.`
      )}
      ${cta('https://naggare.com/home', 'Browse JD cards', 'indigo')}`,
      sig('indigo')
    )
  }
}

// ─── Profile updated email ────────────────────────────────────────────────────

export function emailCandidateProfileUpdated(candidateName: string): { subject: string; html: string } {
  const first = candidateName.split(' ')[0]
  return {
    subject: `${first}, your Naggare profile has been updated`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero(`Looking good, ${first}.`, 'Your profile is live and up to date.'),
      `${letter([
        `Hi ${first},`,
        `Your Naggare profile has been updated successfully. Recruiters browsing the platform will now see your latest information.`,
        `A strong, current profile is your best asset. The more complete and honest it is, the better your chances of finding a role that truly fits.`,
        `Your next opportunity could be just a few swipes away.`,
      ])}
      ${infoBox('indigo', 'What to do next',
        `<strong>📋 Browse JD cards</strong> — explore roles matched to your updated profile.<br/><br/>
         <strong>⭐ Super Pursue</strong> — once a month, go all-in on a recruiter you genuinely want to work with.<br/><br/>
         <strong>📬 Monday digest</strong> — fresh matched JDs land in your inbox every week.`
      )}
      ${cta('https://naggare.com/home', 'Browse JDs now', 'indigo')}`,
      sig('indigo')
    )
  }
}

// ─── Additional candidate emails ─────────────────────────────────────────────

export function emailCandidateExpressedInterest(name: string, jobTitle: string, company: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `You expressed interest in ${jobTitle} at ${company}`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero('Interest noted.', `${jobTitle} at ${company}`),
      `${letter([
        `Hi ${first},`,
        `You expressed interest in the ${jobTitle} role at ${company}. The recruiter has been notified.`,
        `If they're interested too, it's a match — and you'll both be notified. Until then, keep browsing.`,
      ])}
      ${cta('https://naggare.com/home', 'Browse more roles', 'indigo')}`,
      sig('indigo')
    )
  }
}

export function emailCandidateGoldenBuzzer(name: string, recruiterName: string, company: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `${recruiterName} at ${company} just Golden Buzzed you`,
    html: layout(
      `linear-gradient(135deg,#D97706 0%,#B45309 100%)`,
      hero('You got a Golden Buzzer.', `${recruiterName} at ${company} went all in.`),
      `${letter([
        `Hi ${first},`,
        `${recruiterName} from ${company} used their Golden Buzzer on your profile — they only get one a month and they chose you.`,
        `This is their strongest signal of interest. Visit your profile to see the role and decide if you want to pursue it.`,
      ])}
      ${cta('https://naggare.com/home', 'View the role', 'indigo')}`,
      sig('indigo')
    )
  }
}

export function emailCandidateJDClosed(name: string, jobTitle: string, company: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `Update: ${jobTitle} at ${company} is no longer active`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero('Role update.', `${jobTitle} at ${company}`),
      `${letter([
        `Hi ${first},`,
        `The ${jobTitle} role at ${company} has been closed by the recruiter. It will no longer appear in your matches.`,
        `There are plenty of other roles waiting — keep browsing.`,
      ])}
      ${cta('https://naggare.com/home', 'Browse roles', 'indigo')}`,
      sig('indigo')
    )
  }
}

export function emailCandidateMatch(name: string, jobTitle: string, company: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `It is a match — ${jobTitle} at ${company}`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero('It is a match.', `${jobTitle} at ${company}`),
      `${letter([
        `Hi ${first},`,
        `You and the recruiter at ${company} are both interested in the ${jobTitle} role. That is a mutual match on Naggare.`,
        `Expect to hear from them directly. In the meantime, keep your profile sharp.`,
      ])}
      ${cta('https://naggare.com/home', 'View your matches', 'indigo')}`,
      sig('indigo')
    )
  }
}

export function emailCandidateProfileDeleted(name: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `Your Naggare account has been deleted`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero('Account deleted.', 'Your data has been removed.'),
      `${letter([
        `Hi ${first},`,
        `Your Naggare account and all associated data have been permanently deleted as requested.`,
        `If this was a mistake or you'd like to rejoin in the future, you're always welcome back.`,
      ])}`,
      sig('indigo')
    )
  }
}

export function emailCandidateSuperPursued(name: string, recruiterName: string, company: string, jobTitle: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `${recruiterName} at ${company} is pursuing you for ${jobTitle}`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero('Someone is pursuing you.', `${recruiterName} at ${company}`),
      `${letter([
        `Hi ${first},`,
        `${recruiterName} from ${company} has expressed strong interest in your profile for the ${jobTitle} role.`,
        `Visit Naggare to review the role and decide if you want to express interest back.`,
      ])}
      ${cta('https://naggare.com/home', 'View the role', 'indigo')}`,
      sig('indigo')
    )
  }
}


// ─── Digest Emails ────────────────────────────────────────────────────────────

export function emailRecruiterMonday(name: string, jdsLive: number, newCandidates: number, pendingChats: number): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `Happy Monday ${first} - Here's your week on Naggare`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero('Happy Monday!', `Let's make some great hires this week.`),
      `${letter([
        `Hi ${first},`,
        `Here's a quick look at where things stand as you kick off the week:`,
      ])}
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr>
          <td style="padding:12px;background:#EEF2FF;border-radius:8px;text-align:center;width:33%;">
            <div style="font-size:24px;font-weight:700;color:#4F46E5;">${jdsLive}</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px;">JDs Live</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:12px;background:#F0FDF4;border-radius:8px;text-align:center;width:33%;">
            <div style="font-size:24px;font-weight:700;color:#15803D;">${newCandidates}</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px;">New Candidates</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:12px;background:#FFF7ED;border-radius:8px;text-align:center;width:33%;">
            <div style="font-size:24px;font-weight:700;color:#C2410C;">${pendingChats}</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px;">Pending Chats</div>
          </td>
        </tr>
      </table>
      ${pendingChats > 0 ? `<p style="font-size:13px;color:#374151;margin:12px 0;padding:12px;background:#FFF7ED;border-radius:8px;border-left:3px solid #F97316;">
        You have ${pendingChats} candidate${pendingChats > 1 ? 's' : ''} waiting for your response. Don't leave them hanging!
      </p>` : ''}
      ${cta('https://naggare.com/recruiter/home', 'Go to Dashboard', 'indigo')}`,
      sig('indigo')
    )
  }
}

export function emailRecruiterHumpDay(name: string, pendingChats: number): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `Happy Hump Day ${first} - Halfway there!`,
    html: layout(
      `linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%)`,
      hero('Hump Day!', `It's all downhill from here.`),
      `<div style="text-align:center;margin:16px 0;">
  <svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#C7D2FE"/><stop offset="100%" stop-color="#EEF2FF"/></linearGradient></defs>
    <rect width="200" height="100" fill="url(#sky)" rx="8"/>
    <ellipse cx="100" cy="110" rx="90" ry="55" fill="#4F46E5"/>
    <ellipse cx="100" cy="108" rx="88" ry="52" fill="#6366F1"/>
    <circle cx="100" cy="48" r="8" fill="#FCD34D"/>
    <rect x="97" y="56" width="6" height="12" rx="3" fill="#1E1B4B"/>
    <line x1="100" y1="62" x2="88" y2="70" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round"/>
    <line x1="100" y1="62" x2="112" y2="70" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round"/>
    <line x1="100" y1="68" x2="93" y2="78" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round"/>
    <line x1="100" y1="68" x2="107" y2="78" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round"/>
    <text x="100" y="22" text-anchor="middle" font-size="9" fill="#4F46E5" font-family="sans-serif" font-weight="bold">It's all downhill from here!</text>
  </svg>
</div>
      ${letter([
        `Hi ${first},`,
        `You've made it to Wednesday. The week's peak is behind you - now it's smooth sailing to Friday.`,
        pendingChats > 0
          ? `Quick nudge - you have ${pendingChats} candidate${pendingChats > 1 ? 's' : ''} waiting to hear from you. A quick reply today could make someone's week.`
          : `Your inbox is clear. Browse some fresh candidates and find your next great hire.`,
      ])}
      ${cta('https://naggare.com/recruiter/home', 'Browse Candidates', 'indigo')}`,
      sig('indigo')
    )
  }
}

export function emailRecruiterFriday(name: string, pendingChats: number, expiringJds: number): { subject: string; html: string } {
  const first = name.split(' ')[0]
  const jokes = [
    `Why did the recruiter bring a ladder to the interview? Because they heard the candidate was on another level.`,
    `A recruiter's favourite music? "We Will, We Will ... Shortlist You."`,
    `Why do recruiters make great comedians? Because they always know how to "screen" for the best material.`,
    `What do you call a recruiter on holiday? Unreachable. (Not you though - you're dedicated.)`,
  ]
  const joke = jokes[new Date().getDate() % jokes.length]
  return {
    subject: `Weekend is here ${first} - You've earned it!`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#312E81 100%)`,
      hero('Weekend is here!', `You've put in the work. Now go enjoy it.`),
      `${letter([
        `Hi ${first},`,
        `TGIF! Before you log off, here's a quick laugh:`,
      ])}
      <p style="font-size:13px;color:#374151;padding:16px;background:#EEF2FF;border-radius:8px;font-style:italic;margin:12px 0;">"${joke}"</p>
      ${(pendingChats > 0 || expiringJds > 0) ? `
      <p style="font-size:13px;font-weight:600;color:#1E1B4B;margin:16px 0 8px;">Before you go...</p>
      ${pendingChats > 0 ? `<p style="font-size:13px;color:#374151;margin:6px 0;">${pendingChats} candidate${pendingChats > 1 ? 's' : ''} waiting for your response</p>` : ''}
      ${expiringJds > 0 ? `<p style="font-size:13px;color:#374151;margin:6px 0;">${expiringJds} JD${expiringJds > 1 ? 's' : ''} expiring soon - renew them so candidates can still find you</p>` : ''}
      ` : `<p style="font-size:13px;color:#374151;margin:12px 0;">Your inbox is clear and your JDs are live. Enjoy the weekend guilt-free!</p>`}
      ${cta('https://naggare.com/recruiter/home', 'Quick check-in', 'indigo')}`,
      sig('indigo')
    )
  }
}

export function emailCandidateMonday(name: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  const vibes = [
    `Monday called. You didn't answer. Good for you.`,
    `It's Monday. Coffee first. Everything else can wait.`,
    `Monday is just a reminder that the weekend will happen again in 5 days. Hang tight.`,
    `Scientists have confirmed: Mondays are hard. You're doing great just by showing up.`,
  ]
  const vibe = vibes[new Date().getDate() % vibes.length]
  return {
    subject: `Hey ${first}, it's Monday. Don't panic.`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#534AB7 100%)`,
      hero(`Hey ${first}!`, `Monday doesn't have to be that bad.`),
      `${letter([
        `Hi ${first},`,
        vibe,
        `While you're easing into the week, just a gentle reminder - there are recruiters on Naggare who've posted roles that might be exactly what you're looking for.`,
        `No cover letters. No lengthy forms. Just your profile, one tap, and a real conversation if it's a match.`,
        `Go at your own pace. We've got you.`,
      ])}
      ${cta('https://naggare.com/home', 'Browse Roles', 'indigo')}`,
      sig('indigo')
    )
  }
}

export function emailCandidateHumpDay(name: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `Hump Day ${first}! Halfway there - and so is your next job.`,
    html: layout(
      `linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%)`,
      hero('Hump Day!', `The week's peak is behind you.`),
      `<div style="text-align:center;margin:16px 0;">
  <svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#C7D2FE"/><stop offset="100%" stop-color="#EEF2FF"/></linearGradient></defs>
    <rect width="200" height="100" fill="url(#sky)" rx="8"/>
    <ellipse cx="100" cy="110" rx="90" ry="55" fill="#4F46E5"/>
    <ellipse cx="100" cy="108" rx="88" ry="52" fill="#6366F1"/>
    <circle cx="100" cy="48" r="8" fill="#FCD34D"/>
    <rect x="97" y="56" width="6" height="12" rx="3" fill="#1E1B4B"/>
    <line x1="100" y1="62" x2="88" y2="70" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round"/>
    <line x1="100" y1="62" x2="112" y2="70" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round"/>
    <line x1="100" y1="68" x2="93" y2="78" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round"/>
    <line x1="100" y1="68" x2="107" y2="78" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round"/>
    <text x="100" y="22" text-anchor="middle" font-size="9" fill="#4F46E5" font-family="sans-serif" font-weight="bold">It's all downhill from here!</text>
  </svg>
</div>
      ${letter([
        `Hi ${first},`,
        `You've made it to Wednesday - it's all downhill from here!`,
        `While you're in the flow, don't forget to keep an eye out for roles that excite you.`,
        `On Naggare it's faster than you think - browse, tap Interested, and if the recruiter pursues, you chat. One click away from your next opportunity.`,
      ])}
      ${cta('https://naggare.com/home', 'Browse Roles - One Click Away', 'indigo')}`,
      sig('indigo')
    )
  }
}

export function emailCandidateSaturday(name: string): { subject: string; html: string } {
  const first = name.split(' ')[0]
  return {
    subject: `Happy weekend ${first}! (P.S. don't forget about that dream job)`,
    html: layout(
      `linear-gradient(135deg,${BRAND_INDIGO} 0%,#312E81 100%)`,
      hero(`Enjoy your weekend ${first}!`, `You've earned it.`),
      `${letter([
        `Hi ${first},`,
        `It's Saturday. Sleep in. Eat well. Do absolutely nothing productive if you want to.`,
        `But ... if you do find yourself with 5 spare minutes between your second coffee and your afternoon nap - there are some great roles waiting for you on Naggare.`,
        `No pressure. No forms. No black holes. Just real roles from real recruiters, and a conversation that only starts when both sides are ready.`,
        `Have a brilliant weekend.`,
      ])}
      ${cta('https://naggare.com/home', 'Sneak a peek at roles', 'indigo')}`,
      sig('indigo')
    )
  }
}
