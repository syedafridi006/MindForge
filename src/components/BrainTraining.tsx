'use client';
import { useEffect, useState } from 'react';
import { saveLocalData } from '@/lib/local-data';
import { Brain, Calculator, Eye, Grid3X3, Lightbulb, ListOrdered, RotateCcw } from 'lucide-react';

type GameId = 'Math'|'Memory'|'Reverse recall'|'Patterns'|'Attention'|'Grid memory'|'Logic';
type SavedSession = { id:string; date:string; type:string; minutes:number; score:number; detail:string };
type Stimulus = { word:string; color:string };
type Question = { prompt:string; answer:string; options?:string[]; instruction?:string; stimuli?:Stimulus[]; gridSize?:number };
const games:{id:GameId;desc:string;icon:string}[]=[
 {id:'Math',desc:'Multi-step arithmetic that scales with your level',icon:'math'},
 {id:'Memory',desc:'Longer sequences and tougher recall',icon:'memory'},
 {id:'Reverse recall',desc:'Hold and reverse increasingly long sequences',icon:'reverse'},
 {id:'Patterns',desc:'Discover more complex numerical rules',icon:'pattern'},
 {id:'Attention',desc:'Resist interference across multiple stimuli',icon:'attention'},
 {id:'Grid memory',desc:'Larger grids with more locations to remember',icon:'grid'},
 {id:'Logic',desc:'Deduction, constraints and multi-step reasoning',icon:'logic'},
];
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const uid=()=>Math.random().toString(36).slice(2,10);
const rand=(n:number)=>Math.floor(Math.random()*n);
const pick=<T,>(a:T[])=>a[rand(a.length)];
function makeQuestion(game:GameId,level:number):Question{
 if(game==='Math'){
  if(level<=2){const a=10+rand(30),b=2+rand(20),op=rand(2)?'+':'−';return{prompt:`${a} ${op} ${b} = ?`,answer:String(op==='+'?a+b:a-b),instruction:'Solve mentally. Watch the sign carefully.'};}
  if(level<=5){const a=12+rand(38),b=3+rand(18),c=2+rand(12),op=pick(['+','−','×']);const expression=op==='+'?`${a} + ${b} + ${c}`:op==='−'?`${a} + ${b} − ${c}`:`${a} + (${b} × ${c})`;const result=op==='+'?a+b+c:op==='−'?a+b-c:a+b*c;return{prompt:`${expression} = ?`,answer:String(result),instruction:'Use order of operations. Do not rush.'};}
  if(level<=9){const a=3+rand(12),b=3+rand(12),c=2+rand(15);const d=2+rand(9);const op=pick(['+','−','×']);const result=op==='+'?a*b+c:op==='−'?a*b-c:a*b+c*d;return{prompt:op==='×'?`(${a} × ${b}) + (${c} × ${d}) = ?`:`(${a} × ${b}) ${op} ${c} = ?`,answer:String(result),instruction:'Break the expression into steps.'};}
  const kind=rand(4);if(kind===0){const a=12+rand(28),b=3+rand(15);return{prompt:`(${a}² − ${b}²) ÷ ${a-b} = ?`,answer:String(a+b),instruction:'Look for a useful algebraic identity.'};}
  if(kind===1){const a=12+rand(35),b=3+rand(9);return{prompt:`${a} × ${b} − ${a} × ${b-1} = ?`,answer:String(a),instruction:'Factor the common term instead of multiplying everything.'};}
  if(kind===2){const a=3+rand(12),b=2+rand(9),c=2+rand(8);return{prompt:`(${a} + ${b}) × ${c} − ${a*c} = ?`,answer:String(b*c),instruction:'Use distribution and simplify.'};}
  const a=4+rand(12),b=2+rand(8);return{prompt:`If 3x + ${b} = ${3*a+b}, what is 2x − ${b}?`,answer:String(2*a-b),instruction:'Solve for x first, then evaluate the expression.'};
 }
 if(game==='Memory'||game==='Reverse recall'){
  const len=Math.min(4+Math.floor(level*0.85),18);const seq=Array.from({length:len},()=>rand(10));
  return{prompt:seq.join('  '),answer:(game==='Memory'?seq:[...seq].reverse()).join(''),instruction:game==='Memory'?'Memorize the sequence, then type every digit in the same order.':'Memorize the sequence, then type every digit backwards.'};
 }
 if(game==='Patterns'){
  const start=2+rand(15),step=2+rand(3+level*2),kind=rand(level<4?3:level<9?5:7);let seq:number[],answer:number;
  if(kind===0){seq=[0,1,2,3].map(i=>start+i*step);answer=start+4*step;}
  else if(kind===1){seq=[1,2,3,4].map(i=>start+i*i);answer=start+25;}
  else if(kind===2){seq=[0,1,2,3].map(i=>start+step*(i+1)*(i+2)/2);answer=start+step*15;}
  else if(kind===3){seq=[2,3,4,5].map(i=>i*i+start);answer=36+start;}
  else if(kind===4){seq=[2,4,8,16].map(v=>v+start);answer=32+start;}
  else if(kind===5){seq=[0,1,2,3].map(i=>start+(i+1)*(i+1)*(i+1));answer=start+125;}
  else {seq=[0,1,2,3].map(i=>start+[2,5,10,17][i]);answer=start+26;}
  return{prompt:`${seq.join(', ')}, ?`,answer:String(answer),instruction:'Identify the rule, not just the size of the last jump.'};
 }
 if(game==='Attention'){
  const colors=[{name:'RED',hex:'#ff657c'},{name:'BLUE',hex:'#64a5ff'},{name:'GREEN',hex:'#51d6a7'},{name:'PURPLE',hex:'#bb91ff'},{name:'YELLOW',hex:'#f4d35e'},{name:'ORANGE',hex:'#ffa45b'}];
  const count=Math.min(1+Math.floor(level/2),7);const stimuli=Array.from({length:count},()=>{const word=pick(colors),ink=pick(colors);return{word:word.name,color:ink.hex,answer:ink.name};});
  return{prompt:'Read the ink colours in order.',answer:stimuli.map(s=>(s as Stimulus & {answer:string}).answer).join(', '),stimuli,instruction:`Ignore each word's meaning. Enter the ${count} ink colours from left to right, separated by commas.`};
 }
 if(game==='Grid memory'){
  const size=level<3?3:level<6?4:level<9?5:level<12?6:level<16?7:8;
  const amount=Math.min(Math.max(2,Math.floor(size*size*(0.18+Math.min(level,15)*0.012))),Math.floor(size*size*0.42));const cells=new Set<number>();while(cells.size<amount)cells.add(rand(size*size));
  return{prompt:[...cells].sort((a,b)=>a-b).join(','),answer:[...cells].sort((a,b)=>a-b).join(','),gridSize:size,instruction:`Memorize ${amount} highlighted cells in a ${size} × ${size} grid. Then select their positions.`};
 }
 // Logic questions become progressively more demanding and are generated with known answers.
 if(level<=2){
  const a=2+rand(7),b=2+rand(7);return pick([
   {prompt:`All ${a} members of Team A are trained. Kai is on Team A. What must be true?`,answer:'KAI IS TRAINED',options:['KAI IS TRAINED','KAI IS THE BEST','CANNOT DETERMINE'],instruction:'Apply the statements exactly; do not assume anything extra.'},
   {prompt:`Nia is older than Omar. Omar is older than Pia. Who is youngest?`,answer:'PIA',options:['NIA','OMAR','PIA'],instruction:'Build the order from oldest to youngest.'},
   {prompt:`A drawer has red and blue socks. What is the minimum number you must take blindly to guarantee a matching pair?`,answer:'3',options:['2','3','4'],instruction:'Consider the worst possible first two picks.'}
  ]);
 }
 if(level<=5){
  const n=3+rand(4);const order=['A','B','C','D','E','F'].slice(0,n);const shuffled=[...order].sort(()=>Math.random()-.5);const first=shuffled[0],last=shuffled[n-1];return{prompt:`${n} runners finish a race. ${first} finishes before ${last}. Which conclusion is definitely true?`,answer:`${first} IS NOT LAST`,options:[`${first} IS NOT LAST`,`${last} IS FIRST`,`THEY FINISH TOGETHER`],instruction:'Separate what is guaranteed from what is merely possible.'};
 }
 if(level<=8){
  const x=2+rand(6),y=x+1+rand(4),z=y+1+rand(4);return pick([
   {prompt:`Exactly one of these statements is true: (1) The key is in box A. (2) The key is not in box A. Is the key in box A?`,answer:'CANNOT DETERMINE',options:['YES','NO','CANNOT DETERMINE'],instruction:'Check whether the information uniquely identifies the location.'},
   {prompt:`If every RAV is a MIP, and no MIP is a ZON, can any RAV be a ZON?`,answer:'NO',options:['YES','NO','CANNOT DETERMINE'],instruction:'Chain the category rules carefully.'},
   {prompt:`Three people have ages ${x}, ${y}, and ${z}. The oldest is not Sam. Lee is older than Sam. Who cannot be the youngest?`,answer:'LEE',options:['LEE','SAM','CANNOT DETERMINE'],instruction:'Translate each sentence into a constraint.'}
  ]);
 }
 const p=pick([
  {prompt:'A code has 3 different digits. The first digit is twice the third. The middle digit is 2 more than the third. The digits sum to 14. What is the code?',answer:'853',options:['853','642','426','NOT ENOUGH INFORMATION'],instruction:'Use all three constraints together.'},
  {prompt:'Four books W, X, Y, Z are arranged on a shelf. W is left of X. Y is right of X. Z is left of W. Which book must be farthest left?',answer:'Z',options:['W','X','Y','Z'],instruction:'Combine the ordering constraints into one chain.'},
  {prompt:'A switch is either ON or OFF. If A is ON, B is OFF. If B is OFF, C is ON. A is ON. What must C be?',answer:'ON',options:['ON','OFF','CANNOT DETERMINE'],instruction:'Apply the implications in sequence.'},
  {prompt:'Three boxes are labelled APPLES, ORANGES, and MIXED. Every label is wrong. You may take one fruit from one box. Which labelled box should you sample to identify all boxes?',answer:'MIXED',options:['APPLES','ORANGES','MIXED'],instruction:'Use the fact that every label is incorrect.'}
 ]);return{prompt:p.prompt,answer:p.answer.toUpperCase(),options:p.options.map(x=>x.toUpperCase()),instruction:p.instruction};
}
export default function BrainTraining({onSession}:{onSession:(s:SavedSession)=>void}){
 const [game,setGame]=useState<GameId>('Math'),[level,setLevel]=useState(1),[question,setQuestion]=useState<Question|null>(null),[answer,setAnswer]=useState(''),[feedback,setFeedback]=useState(''),[started,setStarted]=useState(0),[attempts,setAttempts]=useState(0),[correct,setCorrect]=useState(0),[scores,setScores]=useState<Record<string,{level:number;streak:number}>>({});
 const [gridVisible,setGridVisible]=useState(true),[gridCells,setGridCells]=useState<number[]>([]),[gridPick,setGridPick]=useState<number[]>([]);
 useEffect(()=>{try{const x=JSON.parse(localStorage.getItem('mindforge-brain-levels')||'{}');setScores(x);setLevel(x.Math?.level||1);}catch{}},[]);
 const accuracy=attempts?Math.round(correct/attempts*100):0;
 function showQuestion(q:Question,atLevel:number,forGame:GameId){setQuestion(q);setAnswer('');setFeedback('');setStarted(Date.now());setGridPick([]);if(forGame==='Grid memory'){const cells=q.prompt.split(',').map(Number);setGridCells(cells);setGridVisible(true);window.setTimeout(()=>setGridVisible(false),Math.max(850,2100-atLevel*65));}else{setGridCells([]);setGridVisible(false);}}
 function start(nextGame=game){const saved=scores[nextGame]?.level||1;setGame(nextGame);setLevel(saved);setAttempts(0);setCorrect(0);showQuestion(makeQuestion(nextGame,saved),saved,nextGame);}
 function finish(value:string){if(!question||feedback)return;let ok=false;if(game==='Grid memory'){const chosen=[...gridPick].sort((a,b)=>a-b).join(',');ok=chosen===question.answer;}else if(game==='Attention'){ok=value.split(/[,\s]+/).filter(Boolean).map(x=>x.toUpperCase()).join(',')===question.answer;}else{ok=value.trim().toUpperCase()===question.answer.toUpperCase();}
  const nextAttempts=attempts+1,nextCorrect=correct+(ok?1:0);setAttempts(nextAttempts);setCorrect(nextCorrect);setFeedback(ok?'Correct. Good work.':`Not quite. Correct answer: ${game==='Grid memory'?question.answer.split(',').map(n=>Number(n)+1).join(', '):question.answer}`);
  const minutes=Math.max(1,Math.round((Date.now()-started)/60000));onSession({id:uid(),date:today(),type:game,minutes,score:ok?1:0,detail:question.instruction||question.prompt});
  const previous=scores[game]||{level:1,streak:0};const streak=ok?previous.streak+1:0;const nextLevel=streak>=5?Math.min(20,previous.level+1):!ok&&previous.streak>=3?Math.max(1,previous.level-1):previous.level;
  const updated={...scores,[game]:{level:nextLevel,streak:streak>=5?0:streak}};setScores(updated);setLevel(nextLevel);saveLocalData('mindforge-brain-levels',JSON.stringify(updated));
 }
 function next(){showQuestion(makeQuestion(game,level),level,game);}
 const gridSize=question?.gridSize||3;
 return <div className="phase3-stack">
  <div className="phase3-intro"><div><span className="eyebrow">ADAPTIVE PRACTICE</span><h2>Brain training lab</h2><p>Challenges grow more demanding as your level rises. Each game tracks its own level.</p></div><div className="phase3-pill"><Brain size={17}/> Level {level} / 20</div></div>
  <div className="phase3-game-grid"><div className="panel phase3-game-list"><h3>Choose a challenge</h3>{games.map(g=><button key={g.id} className={`phase3-game-option ${game===g.id?'active':''}`} onClick={()=>start(g.id)}><span className="phase3-game-icon">{g.icon==='math'?<Calculator/>:g.icon==='memory'?<Brain/>:g.icon==='reverse'?<RotateCcw/>:g.icon==='pattern'?<ListOrdered/>:g.icon==='attention'?<Eye/>:g.icon==='grid'?<Grid3X3/>:<Lightbulb/>}</span><span><b>{g.id}</b><small>{g.desc}</small></span><small className="tag">L{scores[g.id]?.level||1}</small></button>)}</div>
  <div className="panel phase3-play"><div className="phase3-play-head"><span className="tag">{game.toUpperCase()}</span><span className="round-label">LEVEL {level} · {attempts} ATTEMPTS</span></div>
   {!question?<div className="game-intro"><div className="game-symbol"><Brain size={34}/></div><h2>Choose a challenge to begin</h2><p>Start with a short set. Accuracy comes before speed.</p><button className="primary-btn" onClick={()=>start(game)}>Start {game}</button></div>:<>
    <p className="phase3-instruction">{question.instruction}</p>
    {game==='Grid memory'?<><div className="memory-grid" style={{gridTemplateColumns:`repeat(${gridSize}, minmax(0, 1fr))`,width:`min(100%, ${Math.min(420,gridSize*58)}px)`}}>{Array.from({length:gridSize*gridSize},(_,i)=><button key={i} disabled={gridVisible||!!feedback} className={`memory-cell ${gridVisible&&gridCells.includes(i)?'lit':''} ${gridPick.includes(i)?'picked':''}`} onClick={()=>setGridPick(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])}>{gridVisible&&gridCells.includes(i)?'●':gridPick.includes(i)?'✓':''}</button>)}</div><p className="muted small">{gridVisible?'Memorize the highlighted cells…':`Select ${gridCells.length} cells in the ${gridSize} × ${gridSize} grid.`}</p><button className="primary-btn" disabled={gridVisible||gridPick.length===0||!!feedback} onClick={()=>finish('')}>Check grid ({gridPick.length}/{gridCells.length})</button></>:
    <>{question.stimuli?<div className="attention-sequence">{question.stimuli.map((s,i)=><div className="phase3-stimulus" style={{color:s.color}} key={i}>{s.word}</div>)}</div>:<div className="phase3-question">{question.prompt}</div>}
     {question.options?<div className="phase3-options">{question.options.map(o=><button key={o} className={`secondary-btn ${answer===o?'chosen':''}`} disabled={!!feedback} onClick={()=>{setAnswer(o);finish(o);}}>{o}</button>)}</div>:<form className="phase3-answer" onSubmit={e=>{e.preventDefault();finish(answer);}}><input autoComplete="off" value={answer} disabled={!!feedback} onChange={e=>setAnswer(e.target.value)} placeholder={game==='Attention'?'e.g. BLUE, RED, GREEN':'Type your answer'}/><button className="primary-btn" disabled={!answer.trim()||!!feedback}>Submit</button></form>}</>}
    {feedback&&<div className={`feedback ${feedback.startsWith('Correct')?'good':'bad'}`}>{feedback}</div>}
    <div className="phase3-actions"><button className="text-btn" onClick={next}>Next challenge →</button><button className="text-btn" onClick={()=>{setQuestion(null);setFeedback('');setAnswer('');}}>End session</button></div>
   </>}
   <div className="game-footer"><span>Session accuracy: {accuracy}%</span><span>{correct} correct / {attempts} attempted</span></div>
  </div></div>
  <div className="info-note"><Brain size={18}/><div><b>How adaptive difficulty works</b><p>Each game has its own level (up to 20). Five consecutive correct answers raise that game's level. A mistake after a strong streak may lower it. Difficulty changes include longer sequences, more complex calculations, multi-item attention tests, larger grids and harder deduction puzzles. These scores measure game performance, not IQ or medical cognition.</p></div></div>
 </div>;
}
