import React, { useState, useEffect, useCallback } from 'react';
import MacTitleBar from './components/MacTitleBar';
import CalculatorDisplay from './components/CalculatorDisplay';
import { useCalculator, MathNotesLogic, DateCalculatorLogic } from './useCalculator';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const App = () => {
  const [isLandscape, setIsLandscape] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [mode, setMode] = useState('Basica'); 
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSecond, setIsSecond] = useState(false);
  const [showBinary, setShowBinary] = useState(false);
  
  // Converter
  const [convFrom, setConvFrom] = useState('USD');
  const [convTo, setConvTo] = useState('MXN');

  // Math Notes
  const [mathNote, setMathNote] = useState('2x+5=15');
  const [mathResult, setMathResult] = useState('');
  const [mathGraph, setMathGraph] = useState([]);

  // Date Calculator
  const [dateMode, setDateMode] = useState('diff'); // 'diff' or 'add'
  const [date1, setDate1] = useState(new Date().toISOString().split('T')[0]);
  const [date2, setDate2] = useState('');
  const [addDaysVal, setAddDaysVal] = useState('90');
  const [dateResult, setDateResult] = useState('');

  const calc = useCalculator();

  const getIpcRenderer = () => {
    if (window.require) {
      try {
        return window.require('electron').ipcRenderer;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const handleTogglePip = () => {
    const nextPip = !isPip;
    setIsPip(nextPip);
    const ipc = getIpcRenderer();
    if (ipc) {
      if (nextPip) {
        ipc.send('window-pip');
        setMode('Basica'); // simple mode for pip
      } else {
        ipc.send('window-restore');
      }
    }
  };

  const handleToggleScientific = () => {
    const nextLandscape = !isLandscape;
    setIsLandscape(nextLandscape);
    
    if (nextLandscape) {
      setMode('Cientifica');
    } else {
      setMode('Basica');
    }
    
    const ipc = getIpcRenderer();
    if (ipc && !isPip) {
      if (nextLandscape) {
        ipc.send('window-resize', { width: 900, height: 600 });
      } else {
        ipc.send('window-resize', { width: 520, height: 720 });
      }
    }
  };

  const handleClose = () => {
    const ipc = getIpcRenderer();
    if (ipc) ipc.send('window-close');
    else console.log('Close action triggered');
  };

  const handleMinimize = () => {
    const ipc = getIpcRenderer();
    if (ipc) ipc.send('window-minimize');
    else console.log('Minimize action triggered');
  };

  const selectMode = (m) => {
    setMode(m);
    setShowModeMenu(false);
    
    const ipc = getIpcRenderer();
    if (ipc) {
      if (m === 'Cientifica') {
        setIsLandscape(true);
        ipc.send('window-resize', { width: 900, height: 600 });
      } else if (m === 'Math Notes') {
        setIsLandscape(true);
        ipc.send('window-resize', { width: 900, height: 600 });
      } else {
        setIsLandscape(false);
        ipc.send('window-resize', { width: 520, height: 720 });
      }
    }
  };

  // Run MathNotes logic when input changes
  useEffect(() => {
    if (mode === 'Math Notes') {
      const res = MathNotesLogic.evaluateEquation(mathNote);
      setMathResult(res);
      const graph = MathNotesLogic.generateGraphData(mathNote);
      setMathGraph(graph);
    }
  }, [mathNote, mode]);

  // Run Date Calculator logic
  useEffect(() => {
    if (mode === 'Fechas') {
      if (dateMode === 'diff' && date1 && date2) {
        const diff = DateCalculatorLogic.calculateDiff(date1, date2);
        setDateResult(`${diff} días de diferencia`);
      } else if (dateMode === 'add' && date1 && addDaysVal !== '') {
        const newDate = DateCalculatorLogic.addSomeDays(date1, addDaysVal);
        setDateResult(`Fecha resultado: ${newDate}`);
      } else {
        setDateResult('');
      }
    }
  }, [date1, date2, addDaysVal, dateMode, mode]);

  const renderButtons = () => {
    if (mode === 'Math Notes') {
      return (
        <div className="flex h-full no-drag text-white px-6 pb-6 pt-2 gap-6 w-full">
          {/* Notes Area */}
          <div className="flex-1 flex flex-col bg-[#1A1A1A] rounded-2xl border border-white/10 p-5 shadow-inner">
             <h2 className="text-mac-orange font-bold mb-4 tracking-wider text-xs">LIENZO DE NOTAS MATH</h2>
             <textarea 
               value={mathNote}
               onChange={(e) => setMathNote(e.target.value)}
               className="w-full bg-transparent outline-none resize-none text-2xl font-mono text-white/90 font-light flex-1"
               placeholder="Escribe una ecuación... ej. y = 2x+5 o 2x+5=15"
             />
             <div className="mt-4 pt-4 border-t border-white/10">
               <span className="text-white/40 text-xs tracking-wider uppercase">Resultado:</span>
               <div className="text-4xl text-mac-orange mt-2">{mathResult}</div>
             </div>
          </div>
          {/* Graph Area */}
          <div className="flex-1 bg-[#1A1A1A] rounded-2xl border border-white/10 p-4 flex flex-col shadow-inner">
             <h2 className="text-white/40 font-bold mb-4 tracking-wider text-xs uppercase">Gráfica Interactiva</h2>
             <div className="flex-1 w-full h-full min-h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={mathGraph}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                   <XAxis dataKey="x" stroke="#666" fontSize={10} />
                   <YAxis stroke="#666" fontSize={10} />
                   <Tooltip contentStyle={{backgroundColor:'#222', borderColor:'#444'}} itemStyle={{color:'#FF9500'}} />
                   <Line type="monotone" dataKey="y" stroke="#FF9500" strokeWidth={3} dot={false} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      );
    }

    if (mode === 'Fechas') {
      return (
        <div className="flex flex-col h-full p-4 gap-4 no-drag text-white">
           <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
             <button onClick={()=>setDateMode('diff')} className={`flex-1 py-1.5 text-xs rounded-md transition-all ${dateMode==='diff'?'bg-mac-orange text-white':'text-white/50'}`}>Diferencia</button>
             <button onClick={()=>setDateMode('add')} className={`flex-1 py-1.5 text-xs rounded-md transition-all ${dateMode==='add'?'bg-mac-orange text-white':'text-white/50'}`}>Sumar Días</button>
           </div>
           
           <div className="flex flex-col gap-2 mt-4">
             <label className="text-[10px] text-white/50 uppercase tracking-widest">Desde la Fecha:</label>
             <input type="date" value={date1} onChange={(e)=>setDate1(e.target.value)} className="bg-white/5 p-3 rounded-xl border border-white/10 text-white outline-none" />
           </div>

           {dateMode === 'diff' ? (
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[10px] text-white/50 uppercase tracking-widest">Hasta la Fecha:</label>
                <input type="date" value={date2} onChange={(e)=>setDate2(e.target.value)} className="bg-white/5 p-3 rounded-xl border border-white/10 text-white outline-none" />
              </div>
           ) : (
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[10px] text-white/50 uppercase tracking-widest">Días a sumar:</label>
                <input type="number" value={addDaysVal} onChange={(e)=>setAddDaysVal(e.target.value)} className="bg-white/5 p-3 rounded-xl border border-white/10 text-white outline-none" placeholder="Ej. 90..." />
              </div>
           )}

           <div className="mt-auto p-4 bg-white/5 border border-white/10 rounded-xl text-center">
             <span className="text-white/50 text-[10px] uppercase">Resultado</span>
             <div className="text-xl font-light text-mac-orange mt-1">{dateResult || '-'}</div>
           </div>
        </div>
      );
    }

    if (mode === 'Conversor') {
      return (
        <div className="flex flex-col h-full p-4 gap-4 no-drag">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-white/50 uppercase tracking-widest">De:</label>
            <select className="bg-white/5 p-2 rounded-lg border border-white/10 text-white text-sm outline-none" value={convFrom} onChange={(e) => setConvFrom(e.target.value)}>
              <option value="USD">Dólar (USD)</option>
              <option value="MXN">Peso Mexicano (MXN)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="ARS">Peso Argentino (ARS)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-white/50 uppercase tracking-widest">A:</label>
            <select className="bg-white/5 p-2 rounded-lg border border-white/10 text-white text-sm outline-none" value={convTo} onChange={(e) => setConvTo(e.target.value)}>
              <option value="MXN">Peso Mexicano (MXN)</option>
              <option value="USD">Dólar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="ARS">Peso Argentino (ARS)</option>
            </select>
          </div>
          <button className="glass-btn btn-orange py-3 mt-2 rounded-xl text-sm font-semibold !aspect-auto" onClick={() => calc.convertCurrency(parseFloat(calc.display), convFrom, convTo)}>CONVERTIR</button>
          <div className="calc-grid portrait-grid flex-1">
             {[7,8,9,4,5,6,1,2,3,0].map(n => (
               <button key={n} className={`glass-btn text-lg ${n === 0 ? 'col-span-2 !aspect-auto !rounded-full' : ''}`} onClick={() => calc.inputDigit(n)}>{n}</button>
             ))}
             <button className="glass-btn text-lg" onClick={calc.inputDecimal}>.</button>
             <button className="glass-btn btn-gray text-xs" onClick={calc.deleteLast}>DEL</button>
          </div>
        </div>
      );
    }

    if (mode === 'Progamadora') {
      const charCode = parseInt(calc.display, calc.base);
      const character = !isNaN(charCode) && charCode < 65536 ? String.fromCharCode(charCode) : '?';
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex gap-2 px-4 py-2 text-[10px] no-drag items-center">
            {[16, 10, 8].map(b => (
              <button key={b} className={`px-2 py-1 rounded-md transition-all ${calc.base === b ? 'bg-mac-orange font-bold scale-105' : 'bg-white/5 text-white/40'}`} onClick={() => calc.convertBase(b)}>{b}</button>
            ))}
            <div className="ml-2 px-2 py-1 bg-white/5 rounded border border-white/10 flex flex-col min-w-[40px]">
               <span className="text-[8px] text-white/30 uppercase leading-none">ASCII</span>
               <span className="text-white font-mono text-xs">{character}</span>
            </div>
            <button className="px-2 py-1 rounded bg-white/5 ml-auto border border-white/10 text-white/50" onClick={() => setShowBinary(!showBinary)}>{showBinary ? 'HIDE BIN' : 'SHOW BIN'}</button>
          </div>
          {showBinary && (
            <div className="grid grid-cols-8 gap-x-3 gap-y-1 p-3 text-[9px] font-mono text-white/40 no-drag bg-black/20">
              {calc.binaryValue.split('').map((bit, i) => (
                <span key={i} className={`cursor-pointer hover:text-white transition-colors ${bit === '1' ? 'text-mac-orange font-bold' : ''}`} onClick={() => calc.toggleBit(63 - i)}>{bit}</span>
              ))}
            </div>
          )}
          <div className="calc-grid portrait-grid flex-1 overflow-auto">
            <button className="glass-btn btn-gray text-xs" onClick={calc.clearAll}>{calc.display === '0' ? 'AC' : 'C'}</button>
            <button className="glass-btn btn-gray text-xs" onClick={() => calc.toggleSign()}>±</button>
            <button className="glass-btn btn-gray text-xs" onClick={() => calc.inputPercent()}>%</button>
            <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('÷')}>÷</button>
            {['A', 'B', 'C'].map(char => <button key={char} className="glass-btn text-lg" onClick={() => calc.inputDigit(char)} disabled={calc.base < 16}>{char}</button>)}
            <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('×')}>×</button>
            {[7,8,9].map(n => <button key={n} className="glass-btn text-lg" onClick={() => calc.inputDigit(n)}>{n}</button>)}
            <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('-')}>−</button>
            {[4,5,6].map(n => <button key={n} className="glass-btn text-lg" onClick={() => calc.inputDigit(n)}>{n}</button>)}
            <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('+')}>+</button>
            <button className="glass-btn text-lg col-span-2 !aspect-auto !rounded-full" onClick={() => calc.inputDigit(0)}>0</button>
            <button className="glass-btn text-lg" onClick={calc.calculate}>=</button>
            <button className="glass-btn btn-orange text-xl" onClick={calc.calculate}>=</button>
          </div>
        </div>
      );
    }

    if (mode === 'Cientifica') {
      return (
        <div className="calc-grid landscape-grid h-full w-full">
          <button className="glass-btn" onClick={() => {}}>(</button>
          <button className="glass-btn" onClick={() => {}}>)</button>
          <button className="glass-btn text-xs" onClick={calc.mClear}>mc</button>
          <button className="glass-btn text-xs" onClick={calc.mPlus}>m+</button>
          <button className="glass-btn text-xs" onClick={calc.mMinus}>m-</button>
          <button className="glass-btn text-xs" onClick={calc.mRecall}>mr</button>
          <button className="glass-btn" onClick={calc.deleteLast}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
          </button>
          <button className="glass-btn btn-gray text-xs" onClick={calc.clearAll}>{calc.display === '0' ? 'AC' : 'C'}</button>
          <button className="glass-btn btn-gray" onClick={calc.inputPercent}>%</button>
          <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('÷')}>÷</button>
          <button className="glass-btn text-xs" onClick={() => setIsSecond(!isSecond)}>{isSecond ? '1st' : '2nd'}</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('x2')}>x²</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('x3')}>x³</button>
          <button className="glass-btn text-xs" onClick={() => calc.performOperation('^')}>xʸ</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('ex')}>eˣ</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('10x')}>10ˣ</button>
          {[7,8,9].map(n => <button key={n} className="glass-btn text-lg" onClick={() => calc.inputDigit(n)}>{n}</button>)}
          <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('×')}>×</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('1/x')}>1/x</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('sqrt')}>²√x</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('cbrt')}>³√x</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('yroot')}>ʸ√x</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('ln')}>ln</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('log10')}>log₁₀</button>
          {[4,5,6].map(n => <button key={n} className="glass-btn text-lg" onClick={() => calc.inputDigit(n)}>{n}</button>)}
          <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('-')}>−</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('x!')}>x!</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('sin')}>sin</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('cos')}>cos</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('tan')}>tan</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('e')}>e</button>
          <button className="glass-btn text-xs" onClick={() => {}}>EE</button>
          {[1,2,3].map(n => <button key={n} className="glass-btn text-lg" onClick={() => calc.inputDigit(n)}>{n}</button>)}
          <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('+')}>+</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('rand')}>Rand</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('sinh')}>sinh</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('cosh')}>cosh</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('tanh')}>tanh</button>
          <button className="glass-btn text-xs" onClick={() => calc.scientificOp('pi')}>π</button>
          <button className="glass-btn text-xs" onClick={() => calc.setIsDegrees(!calc.isDegrees)}>{!calc.isDegrees ? 'Rad' : 'Deg'}</button>
          <button className="glass-btn text-lg col-span-2 !aspect-auto !rounded-full" onClick={() => calc.inputDigit(0)}>0</button>
          <button className="glass-btn text-lg" onClick={calc.inputDecimal}>.</button>
          <button className="glass-btn btn-orange text-xl" onClick={calc.calculate}>=</button>
        </div>
      );
    }

    return (
      <div className="calc-grid portrait-grid h-full">
        <button className="glass-btn btn-gray text-xs" onClick={calc.clearAll}>{calc.display === '0' ? 'AC' : 'C'}</button>
        <button className="glass-btn btn-gray text-xs" onClick={calc.toggleSign}>±</button>
        <button className="glass-btn btn-gray text-xs" onClick={calc.inputPercent}>%</button>
        <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('÷')}>÷</button>
        {[7,8,9].map(n => <button key={n} className="glass-btn text-xl" onClick={() => calc.inputDigit(n)}>{n}</button>)}
        <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('×')}>×</button>
        {[4,5,6].map(n => <button key={n} className="glass-btn text-xl" onClick={() => calc.inputDigit(n)}>{n}</button>)}
        <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('-')}>−</button>
        {[1,2,3].map(n => <button key={n} className="glass-btn text-xl" onClick={() => calc.inputDigit(n)}>{n}</button>)}
        <button className="glass-btn btn-orange text-xl" onClick={() => calc.performOperation('+')}>+</button>
        <button className="glass-btn text-xl col-span-2 !aspect-auto !rounded-full" onClick={() => calc.inputDigit(0)}>0</button>
        <button className="glass-btn text-xl" onClick={calc.inputDecimal}>.</button>
        <button className="glass-btn btn-orange text-xl" onClick={calc.calculate}>=</button>
      </div>
    );
  };

  return (
    <div className={`flex items-center justify-center w-screen h-screen bg-transparent overflow-hidden font-sans ${isPip ? 'p-0' : ''}`}>
      <div className={`main-window ${isPip ? '!rounded-none border-none' : ''}`}>
        <MacTitleBar 
          onClose={handleClose} 
          onMinimize={handleMinimize} 
          onTogglePip={handleTogglePip}
          onToggleScientific={handleToggleScientific}
          onModeChange={() => setShowModeMenu(!showModeMenu)}
          onToggleHistory={() => setShowHistory(!showHistory)}
          currentMode={mode}
        />
        
        <div className="flex-1 flex flex-row overflow-hidden relative">
          <div className="flex-1 flex flex-col overflow-hidden">
            {['Basica', 'Cientifica', 'Progamadora', 'Conversor'].includes(mode) && (
              <CalculatorDisplay value={calc.display} formula={calc.formula} isLandscape={mode === 'Cientifica'} hasError={calc.hasError} />
            )}
            <div className="flex-1 overflow-hidden">{renderButtons()}</div>
          </div>

          <AnimatePresence>
            {showHistory && ['Basica', 'Cientifica'].includes(mode) && (
              <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="absolute top-0 right-0 h-full w-64 history-panel flex flex-col p-4 z-20">
                <div className="flex justify-between items-center mb-4 mt-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Historial</h3>
                  <button onClick={calc.clearHistory} className="text-[10px] hover:text-red-400 text-white/30 transition-colors cursor-pointer no-drag">BORRAR</button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 no-drag scroll-smooth">
                  {calc.history.length === 0 ? <p className="text-xs text-white/20 text-center mt-4 italic">No hay resultados</p> : 
                  calc.history.map((h, i) => <div key={i} className="mb-3 p-2 bg-white/5 rounded-lg border border-white/5 text-right"><p className="text-[10px] text-white/40 mb-1">{h.split('=')[0]}</p><p className="text-sm font-bold text-mac-orange">={h.split('=')[1]}</p></div>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Mode Menu Liquid Glass */}
        <AnimatePresence>
          {showModeMenu && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
              className="absolute top-12 right-4 w-48 liquid-menu z-50 p-2 overflow-hidden flex flex-col gap-1 no-drag">
              {['Basica', 'Cientifica', 'Math Notes', 'Fechas', 'Progamadora', 'Conversor'].map(m => (
                <button key={m} onClick={() => selectMode(m)} className={`text-left px-3 py-2 text-xs rounded-md transition-all cursor-pointer no-drag ${mode === m ? 'bg-mac-orange text-white font-bold' : 'hover:bg-white/10 text-white/70'}`}>
                  {m}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
