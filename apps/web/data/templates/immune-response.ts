import type { Template } from "./index";

export const immuneResponseTemplate: Template = {
  name: "Immune Response",
  description: "Complete immune response from viral invasion to antibody production and memory cell formation",
  dsl: `flowchart TD
  pathogen[Pathogen<br/>Virus / Bacteria]
  barrier[1st Defense Line<br/>Skin · Mucous Membrane · Cilia]
  macrophage[Macrophage]
  cytokine[Cytokine<br/>Inflammatory Signaling]
  neutrophil[Neutrophil]
  dendritic[Dendritic Cell]
  lymph[Lymph Node<br/>Immune Command Center]
  tcell[T Cell<br/>Cellular Immunity]
  bcell[B Cell<br/>Humoral Immunity]
  killer[Killer T Cell<br/>CD8+ T Cell]
  antibody[Antibody<br/>IgG / IgM]
  complement[Complement System<br/>Pathogen Destruction]
  memory_t[Memory T Cell<br/>Long-term Immunity]
  memory_b[Memory B Cell<br/>Long-term Immunity]

  pathogen -->|Invasion Attempt| barrier
  barrier -.->|Some Breach| macrophage
  macrophage -->|After Phagocytosis, Present Antigen| cytokine
  cytokine --> neutrophil
  cytokine --> dendritic
  neutrophil -->|Rapid Elimination| pathogen
  dendritic -->|Transfer Antigen Info| lymph
  lymph --> tcell
  lymph --> bcell
  tcell --> killer
  killer -->|Directly Eliminate Infected Cells| pathogen
  bcell --> antibody
  antibody --> complement
  complement -->|Dissolve and Destroy Pathogen| pathogen
  tcell --> memory_t
  bcell --> memory_b

@animation
  step 1: show pathogen
    name: "Show Pathogen"
    description: "Display the virus/bacteria pathogen node on screen."
    effect: bounceIn
    duration: 1s

  step 2: highlight pathogen
    name: "Highlight Pathogen"
    description: "Highlight the pathogen."
    color: #F44336
    glow: true
    duration: 1.5s

  step 3: show barrier
    name: "Show 1st Defense Line"
    description: "Display the skin and mucous membrane defense line node on screen."
    effect: slideInTop
    duration: 1s

  step 4: connect pathogen->barrier
    name: "Invasion Attempt"
    description: "Pathogen hits the 1st defense line."
    flow: particles
    speed: 1.5s

  step 5: highlight barrier
    name: "Highlight 1st Defense Line"
    description: "Highlight the 1st defense line."
    color: #FF9800
    pulse: true
    duration: 1.5s

  step 6: show macrophage
    name: "Show Macrophage"
    description: "Display the macrophage node on screen."
    effect: scaleIn
    duration: 1s

  step 7: connect barrier->macrophage
    name: "Defense Breach"
    description: "Some pathogens breach the defense and meet macrophage."
    flow: dash
    speed: 1.5s

  step 8: highlight macrophage
    name: "Highlight Macrophage"
    description: "Highlight the macrophage."
    color: #FF5722
    glow: true
    duration: 1.5s

  step 9: show cytokine
    name: "Show Cytokine"
    description: "Display the cytokine signaling molecule node on screen."
    effect: fadeIn
    duration: 0.8s

  step 10: connect macrophage->cytokine
    name: "Release Inflammation Signal"
    description: "Macrophage releases cytokine signal."
    flow: particles
    speed: 1.5s

  step 11: highlight cytokine
    name: "Highlight Cytokine"
    description: "Highlight the cytokine."
    color: #FF9800
    pulse: true
    duration: 1s

  step 12: show neutrophil, dendritic
    name: "Show Neutrophil and Dendritic Cell"
    description: "Display neutrophil and dendritic cell nodes on screen."
    effect: slideInBottom
    stagger: 0.3s
    duration: 0.8s

  step 13: connect cytokine->neutrophil
    name: "Recruit Neutrophils"
    description: "Cytokine signal recruits neutrophils."
    flow: particles
    speed: 1.5s

  step 14: connect cytokine->dendritic
    name: "Activate Dendritic Cell"
    description: "Cytokine signal activates dendritic cell."
    flow: particles
    speed: 1.5s

  step 15: highlight neutrophil
    name: "Highlight Neutrophil"
    description: "Highlight the neutrophil."
    color: #FF5722
    pulse: true
    duration: 1s

  step 16: connect neutrophil->pathogen
    name: "Neutrophil Rapid Elimination"
    description: "Neutrophil rapidly eliminates pathogen."
    flow: particles
    speed: 1.5s

  step 17: show lymph
    name: "Show Lymph Node"
    description: "Display the lymph node on screen."
    effect: scaleIn
    duration: 1s

  step 18: connect dendritic->lymph
    name: "Transfer Antigen Info"
    description: "Dendritic cell transfers antigen info to lymph node."
    flow: particles
    speed: 1.5s

  step 19: highlight lymph
    name: "Highlight Lymph Node"
    description: "Highlight the lymph node."
    color: #9C27B0
    glow: true
    duration: 1.5s

  step 20: show tcell, bcell
    name: "Show T Cell and B Cell"
    description: "Display T cell and B cell nodes on screen."
    effect: flipIn
    stagger: 0.3s
    duration: 0.8s

  step 21: connect lymph->tcell
    name: "Activate T Cell"
    description: "T cell is activated at lymph node."
    flow: particles
    speed: 1.5s

  step 22: connect lymph->bcell
    name: "Activate B Cell"
    description: "B cell is activated at lymph node."
    flow: particles
    speed: 1.5s

  step 23: show killer
    name: "Show Killer T Cell"
    description: "Display the killer T cell node on screen."
    effect: scaleIn
    duration: 0.8s

  step 24: connect tcell->killer
    name: "Differentiate to Killer T Cell"
    description: "T cell differentiates into killer T cell."
    flow: arrow
    speed: 1s

  step 25: connect killer->pathogen
    name: "Eliminate Infected Cell"
    description: "Killer T cell directly eliminates infected cell."
    flow: particles
    speed: 1.5s

  step 26: highlight killer
    name: "Highlight Killer T Cell"
    description: "Highlight the killer T cell."
    color: #E91E63
    glow: true
    duration: 1.5s

  step 27: show antibody
    name: "Show Antibody"
    description: "Display the antibody node on screen."
    effect: bounceIn
    duration: 0.8s

  step 28: connect bcell->antibody
    name: "Produce Antibody"
    description: "B cell produces antibody."
    flow: particles
    speed: 1.5s

  step 29: show complement
    name: "Show Complement System"
    description: "Display the complement system node on screen."
    effect: fadeIn
    duration: 0.8s

  step 30: connect antibody->complement
    name: "Activate Complement"
    description: "Antibody activates complement system."
    flow: arrow
    speed: 1s

  step 31: connect complement->pathogen
    name: "Destroy Pathogen"
    description: "Complement system destroys pathogen."
    flow: particles
    speed: 1.5s

  step 32: highlight antibody, complement
    name: "Highlight Antibody-Complement"
    description: "Highlight antibody and complement system."
    color: #2196F3
    glow: true
    duration: 1.5s

  step 33: show memory_t, memory_b
    name: "Show Memory Cells"
    description: "Display memory T cell and memory B cell nodes on screen."
    effect: slideInBottom
    stagger: 0.3s
    duration: 1s

  step 34: connect tcell->memory_t
    name: "Form Memory T Cell"
    description: "Some T cells differentiate into memory T cell."
    flow: arrow
    speed: 1s

  step 35: connect bcell->memory_b
    name: "Form Memory B Cell"
    description: "Some B cells differentiate into memory B cell."
    flow: arrow
    speed: 1s

  step 36: highlight memory_t, memory_b
    name: "Highlight Memory Cells"
    description: "Highlight memory cells."
    color: #4CAF50
    glow: true
    duration: 2s

  step 37: camera fitAll
    name: "Camera Fit All"
    description: "Adjust camera to show entire immune response flow."
    padding: 40px
    duration: 2s
@end

@style
  pathogen:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 3px

  barrier:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  macrophage:
    fill: #fbe9e7
    stroke: #FF5722
    stroke-width: 3px

  cytokine:
    fill: #fff8e1
    stroke: #FFC107
    stroke-width: 2px

  neutrophil:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 2px

  dendritic:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px

  lymph:
    fill: #ede7f6
    stroke: #7E57C2
    stroke-width: 3px

  tcell, bcell:
    fill: #e3f2fd
    stroke: #1E88E5
    stroke-width: 2px

  killer:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 3px

  antibody, complement:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 2px

  memory_t, memory_b:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
@end

@narration
  step 1:
    title: "Our Body's Army - The Immune System"
    text: "At every moment, our body fights tens of millions of pathogens. The immune system has two layers. The first is innate immunity, which is fast but not precise. The second is adaptive immunity, which is slow but accurately targets specific pathogens. Let's explore what happens when a virus invades."

  step 3:
    title: "1st Defense Line - Physical Barrier"
    text: "The first barrier is skin. Skin is not just a surface but a living barrier, constantly replacing cells to prevent intruders. The airway has mucus and cilia that trap viruses and expel them outward. The acidic environment of mouth and stomach kills most bacteria. Most invasions are blocked at this line."

  step 8:
    title: "Macrophage - First Responder Team"
    text: "The first immune cell to meet pathogens that breach the defense is macrophage ('big eating cell'). It engulfs pathogens through phagocytosis and breaks them down. More importantly, as it breaks down pathogens, it presents antigen (information fragments) on its surface. This signals adaptive immunity activation."

  step 11:
    title: "Cytokine - Immune Alert System"
    text: "When macrophages detect infection, they secrete signaling proteins called cytokines. Interleukins and TNF-alpha expand blood vessels (causing fever and redness) and call more immune cells to the site. Fever is uncomfortable, but high temperature suppresses viral replication and enhances immune response."

  step 16:
    title: "Neutrophil - Front-line Soldier"
    text: "Neutrophils make up 60-70% of blood leukocytes, the most abundant immune cell. Upon receiving cytokine signals, they rush to infection sites in minutes. They engulf pathogens and secrete reactive oxygen species and antimicrobial proteins to destroy them. Living only 1-5 days, they're essential for rapid early elimination."

  step 19:
    title: "Lymph Node - Immune Command Center"
    text: "Dendritic cells are reconnaissance scouts from infection sites. After processing pathogens and carrying antigen information, they move to lymph nodes where T cells and B cells wait. When dendritic cells report 'this antigen appears', matching T cells and B cells explosively proliferate."

  step 26:
    title: "Killer T Cell - Precision Strike"
    text: "Killer T cells (CD8+ T Cell) directly find and kill virus-infected cells. Viruses hide inside cells where antibodies can't reach and replicate. But infected cells display a signal saying they're infected. Killer T cells recognize this signal and induce cell suicide (apoptosis). They eliminate the virus's replication factory entirely."

  step 32:
    title: "Antibody - Targeting Missile"
    text: "Antibodies produced by B cells are proteins that bind only to specific antigens. When antibodies bind to pathogens, the complement system activates. About 30 proteins in complement cascade create holes in pathogen cell membranes, destroying them. Antibody-covered pathogens are also easier for macrophages to engulf."

  step 36:
    title: "Memory Cell - Secret to Lifelong Immunity"
    text: "When infection resolves, most immune cells die. But some T and B cells differentiate into memory cells, staying in the body for decades. When the same pathogen invades again, memory cells react immediately, completing immune response in hours instead of days. Vaccines work on this principle, creating memory cells with weakened pathogens."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
