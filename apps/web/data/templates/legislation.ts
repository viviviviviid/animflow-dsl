import type { Template } from "./index";

export const legislationTemplate: Template = {
  name: "How a Bill Becomes Law",
  description: "Complete legislative process from citizen petition to presidential promulgation in Korea",
  dsl: `flowchart TD
  citizen[Citizen / Civic Group<br/>Legislative Petition]
  lawmaker[National Assemblyman<br/>Bill Submission]
  bill[Bill Receipt<br/>Requires 10+ Cosignatures]
  committee[Standing Committee<br/>Specialized Review]
  subcommittee[Bill Review Subcommittee<br/>Clause-by-clause Deliberation]
  public[Public Hearing<br/>Experts · Stakeholders]
  legalreview[Legislative and Judicial Committee<br/>Systematic and Language Review]
  plenary[Plenary Session<br/>Full Assembly Discussion]
  vote[Vote<br/>Majority of Quorum Approval]
  rejected[Rejected<br/>Failed / Term Expiration]
  president[President<br/>Signature or Veto]
  vetoed[Veto Request<br/>National Assembly Reconsideration]
  promulgate[Official Gazette Publication<br/>Law Effective]
  enforce[Enforcement<br/>20+ Days After Promulgation]

  citizen -->|Petition / Legislative Request| lawmaker
  lawmaker -->|Submit Bill| bill
  bill -->|Assign| committee
  committee --> subcommittee
  subcommittee --> public
  public -->|After Opinion Gathering| subcommittee
  subcommittee -->|Pass| legalreview
  subcommittee -.->|Reject Decision| rejected
  legalreview -->|Pass Systematic Review| plenary
  plenary --> vote
  vote -.->|Rejected| rejected
  vote -->|Passed| president
  president -->|Signature| promulgate
  president -.->|Exercise Veto| vetoed
  vetoed -->|2/3 Assembly Approval| promulgate
  vetoed -.->|Below 2/3| rejected
  promulgate --> enforce

@animation
  step 1: show citizen
    name: "Show Citizen"
    description: "Display the citizen/civic group node on screen."
    effect: fadeIn
    duration: 1s

  step 2: highlight citizen
    name: "Highlight Citizen"
    description: "Highlight the citizen."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show lawmaker
    name: "Show National Assemblyman"
    description: "Display the National Assemblyman node on screen."
    effect: slideInTop
    duration: 0.8s

  step 4: connect citizen->lawmaker
    name: "Legislative Petition"
    description: "Citizen petitions National Assemblyman for legislation."
    flow: particles
    speed: 1.5s

  step 5: highlight lawmaker
    name: "Highlight National Assemblyman"
    description: "Highlight the National Assemblyman."
    color: #3F51B5
    pulse: true
    duration: 1s

  step 6: show bill
    name: "Show Bill Receipt"
    description: "Display the bill receipt node on screen."
    effect: scaleIn
    duration: 0.8s

  step 7: connect lawmaker->bill
    name: "Submit Bill"
    description: "National Assemblyman submits bill."
    flow: particles
    speed: 1.5s

  step 8: highlight bill
    name: "Highlight Bill"
    description: "Highlight the bill."
    color: #3F51B5
    pulse: true
    duration: 1s

  step 9: show committee
    name: "Show Standing Committee"
    description: "Display the Standing Committee node on screen."
    effect: slideInRight
    duration: 0.8s

  step 10: connect bill->committee
    name: "Assign to Committee"
    description: "Bill is assigned to standing committee."
    flow: arrow
    speed: 1.5s

  step 11: highlight committee
    name: "Highlight Standing Committee"
    description: "Highlight the standing committee."
    color: #9C27B0
    glow: true
    duration: 1s

  step 12: show subcommittee
    name: "Show Subcommittee"
    description: "Display the Bill Review Subcommittee node on screen."
    effect: fadeIn
    duration: 0.8s

  step 13: connect committee->subcommittee
    name: "Delegate to Subcommittee"
    description: "Committee delegates review to subcommittee."
    flow: arrow
    speed: 1s

  step 14: show public
    name: "Show Public Hearing"
    description: "Display the public hearing node on screen."
    effect: bounceIn
    duration: 0.8s

  step 15: connect subcommittee->public
    name: "Hold Public Hearing"
    description: "Subcommittee holds public hearing."
    flow: particles
    speed: 1.5s

  step 16: highlight public
    name: "Highlight Public Hearing"
    description: "Highlight the public hearing."
    color: #4CAF50
    pulse: true
    duration: 1.5s

  step 17: connect public->subcommittee
    name: "Gathering Complete"
    description: "Public hearing opinions are reflected in subcommittee."
    flow: particles
    speed: 1s

  step 18: show rejected
    name: "Show Rejection"
    description: "Display the rejection node on screen."
    effect: fadeIn
    duration: 0.8s

  step 19: connect subcommittee->rejected
    name: "Subcommittee Rejection Path"
    description: "Subcommittee may decide to reject."
    flow: dash
    speed: 1.5s

  step 20: show legalreview
    name: "Show Legislative Committee"
    description: "Display the Legislative and Judicial Committee node on screen."
    effect: scaleIn
    duration: 0.8s

  step 21: connect subcommittee->legalreview
    name: "Refer to Legislative Committee"
    description: "Refer to Legislative Committee after subcommittee passage."
    flow: arrow
    speed: 1.5s

  step 22: highlight legalreview
    name: "Highlight Legislative Committee"
    description: "Highlight the Legislative and Judicial Committee."
    color: #795548
    glow: true
    duration: 1.5s

  step 23: show plenary
    name: "Show Plenary Session"
    description: "Display the plenary session node on screen."
    effect: flipIn
    duration: 1s

  step 24: connect legalreview->plenary
    name: "Bring to Plenary"
    description: "Bring to plenary after legislative committee passage."
    flow: particles
    speed: 1.5s

  step 25: highlight plenary
    name: "Highlight Plenary Session"
    description: "Highlight the plenary session."
    color: #FF9800
    glow: true
    duration: 1.5s

  step 26: show vote
    name: "Show Vote"
    description: "Display the vote node on screen."
    effect: scaleIn
    duration: 0.8s

  step 27: connect plenary->vote
    name: "Conduct Vote"
    description: "Vote is conducted at plenary session."
    flow: particles
    speed: 1.5s

  step 28: highlight vote
    name: "Highlight Vote"
    description: "Highlight the vote."
    color: #FF9800
    pulse: true
    duration: 2s

  step 29: connect vote->rejected
    name: "Rejection Path"
    description: "Bill may be rejected in vote."
    flow: dash
    speed: 1.5s

  step 30: show president
    name: "Show President"
    description: "Display the President node on screen."
    effect: bounceIn
    duration: 1s

  step 31: connect vote->president
    name: "Send After Passage"
    description: "Passed bill is sent to President."
    flow: particles
    speed: 1.5s

  step 32: highlight president
    name: "Highlight President"
    description: "Highlight the President."
    color: #F44336
    glow: true
    duration: 1.5s

  step 33: show vetoed
    name: "Show Veto Request"
    description: "Display the veto request node on screen."
    effect: fadeIn
    duration: 0.8s

  step 34: connect president->vetoed
    name: "Exercise Veto"
    description: "President may exercise veto."
    flow: dash
    speed: 1.5s

  step 35: connect vetoed->rejected
    name: "Reconsideration Failure"
    description: "Bill rejected if reconsideration fails at 2/3."
    flow: dash
    speed: 1.5s

  step 36: show promulgate
    name: "Show Promulgation"
    description: "Display the Official Gazette publication node on screen."
    effect: scaleIn
    duration: 1s

  step 37: connect president->promulgate
    name: "Presidential Signature"
    description: "President signs and law is promulgated."
    flow: particles
    speed: 1.5s

  step 38: connect vetoed->promulgate
    name: "Reconsideration Passage"
    description: "Law promulgated after 2/3 assembly approval."
    flow: particles
    speed: 1.5s

  step 39: highlight promulgate
    name: "Highlight Promulgation"
    description: "Highlight law promulgation."
    color: #4CAF50
    glow: true
    duration: 1.5s

  step 40: show enforce
    name: "Show Enforcement"
    description: "Display the enforcement node on screen."
    effect: flipIn
    duration: 1s

  step 41: connect promulgate->enforce
    name: "Law Enforcement"
    description: "Law is enforced after certain period from promulgation."
    flow: particles
    speed: 1.5s

  step 42: highlight enforce
    name: "Highlight Enforcement"
    description: "Highlight law enforcement."
    color: #4CAF50
    pulse: true
    duration: 2s

  step 43: camera fitAll
    name: "Camera Fit All"
    description: "Adjust camera to show entire legislative process."
    padding: 40px
    duration: 2s
@end

@style
  citizen:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  lawmaker:
    fill: #e8eaf6
    stroke: #3F51B5
    stroke-width: 3px

  bill:
    fill: #e8eaf6
    stroke: #3F51B5
    stroke-width: 2px

  committee:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px

  subcommittee:
    fill: #f3e5f5
    stroke: #AB47BC
    stroke-width: 2px

  public:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  legalreview:
    fill: #efebe9
    stroke: #795548
    stroke-width: 3px

  plenary:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  vote:
    fill: #fff3e0
    stroke: #F57C00
    stroke-width: 3px

  rejected:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 2px

  president:
    fill: #ffebee
    stroke: #C62828
    stroke-width: 3px

  vetoed:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 2px

  promulgate:
    fill: #e8f5e9
    stroke: #2E7D32
    stroke-width: 3px

  enforce:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
@end

@narration
  step 1:
    title: "How Are Laws Made?"
    text: "The laws regulating our daily lives don't emerge overnight. They must go through multiple review stages starting from public demand. The Korean Constitution follows separation of powers, with legislative power held by the National Assembly. Over 20,000 bills are processed annually, but only about 30% pass plenary session."

  step 5:
    title: "Bill Submission - National Assemblyman's Role"
    text: "Only National Assemblymen and the government can submit bills. When assemblymen submit, 10+ other assemblymen must cosign. Citizens can also submit via the National Agreement Petition system with 100,000+ signatures. The 2020 National Agreement Petition system allows ordinary citizens to directly participate in legislation."

  step 11:
    title: "Standing Committee - Expert Group Review"
    text: "The National Assembly has 17 standing committees. Each comprises assemblymen with expertise in their field. Bills are assigned to relevant standing committees. Medical bills go to Health and Welfare Committee, tax bills to Planning and Finance Committee."

  step 16:
    title: "Public Hearing - Site of Democracy"
    text: "Important bills hold public hearings to gather expert, stakeholder, and citizen opinions. For example, medical law amendments hear from doctors, patient groups, legal scholars, and civic groups. Public hearings identify problems and reflect diverse perspectives - a democratic procedure. However, in reality, public hearings are sometimes skipped or conducted formally."

  step 22:
    title: "Legislative and Judicial Committee - Final Gateway"
    text: "The Legislative Committee is the final gateway all bills must pass before plenary. It reviews not content but 'conflicts with other laws', 'constitutional violations', 'appropriate terminology'. If the Legislative Committee delays, legislation stalls - a source of criticism."

  step 25:
    title: "Plenary Session - Final Review Watched by Nation"
    text: "Bills passing committees reach plenary session. All 300 assemblymen participate in discussion and voting. National Assembly plenary is broadcast live and remarks recorded. Assemblymen express positions through support and opposition speeches."

  step 28:
    title: "Vote - Core of Democracy"
    text: "Passage requires majority attendance of quorum members and majority approval of attendees. If 150 of 300 attend, 76+ approvals pass. Real-time electronic voting system counts. Constitutional amendments and requests for prime minister removal require higher standards: majority of quorum or 2/3."

  step 32:
    title: "President's Role - Signature or Veto"
    text: "Bills passing National Assembly must be promulgated or vetoed by President within 15 days. If veto is exercised, it returns to National Assembly requiring majority attendance plus 2/3 approval to pass. Historically, presidential veto is rare, but in divided government becomes important check."

  step 42:
    title: "Promulgation and Enforcement - Birth of Law"
    text: "Signed laws are published in the Official Gazette and promulgated. Typically enforced 20+ days after promulgation, but major changes often have 1+ year grace periods. Even after enforcement, laws lose effect if Constitutional Court rules them unconstitutional. From birth to abolition, democracy is constant movement."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
