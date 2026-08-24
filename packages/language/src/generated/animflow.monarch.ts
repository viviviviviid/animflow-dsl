// Monarch syntax highlighting for the animflow language.
export default {
    keywords: [
        'action','anchor','animflow','arrow','auto','background','badge','both','by','callout','camera','canvas','card','circle','clearHighlight','curve','dash','dashed','database','diamond','distance','document','dotted','down','draw','duration','e','edge','effect','end','fade','fit','flip','flow','focus','from','glow','graph','hide','highlight','initial','label','layout','left','lightning','line','ms','n','node','nodeGap','none','orthogonal','overlay','padding','parallelogram','particles','pill','pin','pop','position','pulse','rankGap','rectangle','right','rounded','routing','s','say','scene','sequence','shape','show','size','slide','solid','stagger','start','story','straight','text','theme','tone','trace','up','via','w','wave','width','x','y'
    ],
    operators: [
        '*',',','->','.',':'
    ],
    symbols: /\(|\)|\*|,|->|\.|:|\[|\]|\{|\}/,

    tokenizer: {
        initial: [
            { regex: /[_a-zA-Z][\w_]*/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"ID"} }} },
            { regex: /[0-9]+(\.[0-9]+)?/, action: {"token":"number"} },
            { regex: /"(\\.|[^"\\])*"/, action: {"token":"string"} },
            { include: '@whitespace' },
            { regex: /@symbols/, action: { cases: { '@operators': {"token":"operator"}, '@default': {"token":""} }} },
        ],
        whitespace: [
            { regex: /\s+/, action: {"token":"white"} },
            { regex: /\/\*/, action: {"token":"comment","next":"@comment"} },
            { regex: /\/\/[^\n\r]*/, action: {"token":"comment"} },
        ],
        comment: [
            { regex: /[^/\*]+/, action: {"token":"comment"} },
            { regex: /\*\//, action: {"token":"comment","next":"@pop"} },
            { regex: /[/\*]/, action: {"token":"comment"} },
        ],
    }
};
