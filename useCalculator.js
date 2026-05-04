import { useState, useCallback, useMemo, useEffect } from 'react';
import { create, all } from 'mathjs';
import { differenceInDays, addDays, format, isValid, parseISO } from 'date-fns';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});

export const useCalculator = () => {
  const [display, setDisplay] = useState('0');
  const [formula, setFormula] = useState('');
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [memory, setMemory] = useState(0);
  const [isDegrees, setIsDegrees] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // History is loaded from localStorage once eagerly
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('calc-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist history max 50 items
  useEffect(() => {
    localStorage.setItem('calc-history', JSON.stringify(history.slice(0, 50)));
  }, [history]);

  // Programmer Mode State
  const [base, setBase] = useState(10); 
  const [bits, setBits] = useState(new Array(64).fill(0));

  const triggerError = () => {
    setDisplay('Error');
    setHasError(true);
    setShouldResetDisplay(true);
    setTimeout(() => setHasError(false), 500); // 500ms shake animation length
  };

  const clearAll = useCallback(() => {
    setDisplay('0');
    setFormula('');
    setShouldResetDisplay(false);
    setHasError(false);
  }, []);

  const clearEntry = useCallback(() => {
    setDisplay('0');
    setHasError(false);
  }, []);

  const deleteLast = useCallback(() => {
    if (hasError) return clearAll();
    setDisplay(prev => {
      if (prev.length === 1 || (prev.length === 2 && prev.startsWith('-'))) return '0';
      return prev.slice(0, -1);
    });
  }, [hasError, clearAll]);

  const inputDigit = useCallback((digit) => {
    if (hasError) clearAll();
    setDisplay(prev => {
      if (shouldResetDisplay || hasError) {
        setShouldResetDisplay(false);
        return String(digit);
      }
      if (prev === '0' && digit !== '.') return String(digit);
      return prev + digit;
    });
  }, [shouldResetDisplay, hasError, clearAll]);

  const inputDecimal = useCallback(() => {
    if (hasError) clearAll();
    setDisplay(prev => {
      if (shouldResetDisplay || hasError) {
        setShouldResetDisplay(false);
        return '0.';
      }
      if (!prev.includes('.')) return prev + '.';
      return prev;
    });
  }, [shouldResetDisplay, hasError, clearAll]);

  const toggleSign = useCallback(() => {
    if (hasError) return;
    setDisplay(prev => {
      if (prev === '0') return prev;
      return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
    });
  }, [hasError]);

  const inputPercent = useCallback(() => {
    try {
      const result = math.evaluate(`${display} / 100`);
      setDisplay(math.format(result, { notation: 'fixed', precision: 14 }).replace(/\.?0+$/, ''));
      setShouldResetDisplay(true);
    } catch {
      triggerError();
    }
  }, [display]);

  const performOperation = useCallback((nextOperation) => {
    if (hasError) return;
    if (shouldResetDisplay && formula) {
      // Just change operator if we haven't typed a new number yet
      setFormula(prev => prev.replace(/[\+\-\×\÷\^]$/, nextOperation));
      return;
    }

    setFormula(prev => {
      const mappedOp = nextOperation === '×' ? '*' : nextOperation === '÷' ? '/' : nextOperation;
      return `${prev} ${display} ${mappedOp}`;
    });
    setShouldResetDisplay(true);
  }, [display, shouldResetDisplay, formula, hasError]);

  const calculate = useCallback(() => {
    if (!formula || hasError) return;
    try {
      const cleanFormula = formula + ' ' + display;
      let evalFormula = cleanFormula.replace(/×/g, '*').replace(/÷/g, '/');
      
      const result = math.evaluate(evalFormula);
      const cleanResult = math.format(result, { precision: 14 }).replace(/\.?0+$/, '').replace(/e\+?/, 'e');
      
      const entry = `${cleanFormula.replace(/\*/g, '×').replace(/\//g, '÷')} = ${cleanResult}`;
      setHistory(prev => [entry, ...prev].slice(0, 50));
      setDisplay(String(cleanResult));
      setFormula('');
      setShouldResetDisplay(true);
    } catch (e) {
      triggerError();
    }
  }, [display, formula, hasError]);

  // Fix: Electron blocks window.confirm when no frame / isolated. Remove confirm to make it work.
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const scientificOp = useCallback((fn) => {
    const value = display;
    let result;
    try {
      // Apple logic: convert some functions internally if degrees
      let expr = '';
      if (fn.match(/^(sin|cos|tan)$/)) {
        expr = isDegrees ? `${fn}(${value} deg)` : `${fn}(${value} rad)`;
      } else if (fn === 'x2') expr = `${value}^2`;
      else if (fn === 'x3') expr = `${value}^3`;
      else if (fn === 'ex') expr = `e^${value}`;
      else if (fn === '10x') expr = `10^${value}`;
      else if (fn === '1/x') expr = `1 / ${value}`;
      else if (fn === 'sqrt') expr = `sqrt(${value})`;
      else if (fn === 'cbrt') expr = `cbrt(${value})`;
      else if (fn === 'ln') expr = `log(${value})`;
      else if (fn === 'log10') expr = `log10(${value})`;
      else if (fn === 'x!') expr = `${value}!`;
      else if (fn === 'pi') { result = Math.PI; }
      else if (fn === 'e') { result = Math.E; }
      else if (fn === 'rand') { result = Math.random(); }

      if (expr) {
        result = math.evaluate(expr);
      }
      
      const formatted = math.format(result, { precision: 14 }).replace(/\.?0+$/, '').replace(/e\+?/, 'e');
      setDisplay(String(formatted));
      setShouldResetDisplay(true);
    } catch {
      triggerError();
    }
  }, [display, isDegrees]);

  const mPlus = useCallback(() => setMemory(prev => prev + parseFloat(display || 0)), [display]);
  const mMinus = useCallback(() => setMemory(prev => prev - parseFloat(display || 0)), [display]);
  const mClear = useCallback(() => setMemory(0), []);
  const mRecall = useCallback(() => {
    setDisplay(String(memory));
    setShouldResetDisplay(true);
  }, [memory]);

  // Programmer logic
  const binaryValue = useMemo(() => {
    const val = parseInt(display, base);
    if (isNaN(val)) return '0'.repeat(64);
    return (val >>> 0).toString(2).padStart(64, '0');
  }, [display, base]);

  const toggleBit = useCallback((index) => {
    const bitsArr = binaryValue.split('');
    bitsArr[63 - index] = bitsArr[63 - index] === '0' ? '1' : '0';
    const newVal = parseInt(bitsArr.join(''), 2);
    setDisplay(newVal.toString(base).toUpperCase());
  }, [binaryValue, base]);

  const convertBase = useCallback((newBase) => {
    const currentVal = parseInt(display, base);
    if (!isNaN(currentVal)) {
      setBase(newBase);
      setDisplay(currentVal.toString(newBase).toUpperCase());
    }
  }, [display, base]);

  // Converter logic
  const convertCurrency = useCallback((amount, from, to) => {
    const rates = {
      'USD': 1,
      'MXN': 17.5,
      'EUR': 0.92,
      'ARS': 850
    };
    const result = math.evaluate(`(${amount} / ${rates[from]}) * ${rates[to]}`);
    setDisplay(math.format(result, { notation: 'fixed', precision: 2 }));
  }, []);

  // Keyboard Listeners - Optimized Single useEffect
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid if the target is an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
      if (e.key === '.') inputDecimal();
      if (e.key === 'Enter' || e.key === '=') calculate();
      if (e.key === 'Backspace') deleteLast();
      if (e.key === 'Escape') clearAll();
      if (e.key === '+') performOperation('+');
      if (e.key === '-') performOperation('-');
      if (e.key === '*') performOperation('×');
      if (e.key === '/') performOperation('÷');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputDigit, inputDecimal, calculate, deleteLast, clearAll, performOperation]);

  return {
    display,
    formula,
    inputDigit,
    inputDecimal,
    clearAll,
    clearEntry,
    deleteLast,
    toggleSign,
    inputPercent,
    performOperation,
    calculate,
    scientificOp,
    mPlus,
    mMinus,
    mClear,
    mRecall,
    memory,
    isDegrees,
    setIsDegrees,
    hasError,
    history,
    clearHistory,
    // Programmer
    base,
    convertBase,
    binaryValue,
    toggleBit,
    // Converter
    convertCurrency
  };
};

export const MathNotesLogic = {
  evaluateEquation: (textEquation) => {
    if (!textEquation) return '';
    try {
      if (textEquation.includes('=')) {
        // Simple linear equation root finder using Secant Method
        // Move everything to LHS: LHS - RHS = 0
        const [lhs, rhs] = textEquation.split('=');
        if (!lhs || !rhs) return 'Falta un lado';
        const expr = math.parse(`${lhs} - (${rhs})`);
        
        const f = (xVal) => {
            const res = expr.evaluate({ x: xVal });
            return Number(res); 
        };
        // Secant method
        let x0 = 0;
        let x1 = 1;
        for (let i = 0; i < 20; i++) {
          let fx0 = f(x0);
          let fx1 = f(x1);
          if (isNaN(fx1) || isNaN(fx0)) return 'Ecuación no válida';
          if (Math.abs(fx1) < 1e-10) return math.format(x1, { precision: 14 });
          if ((fx1 - fx0) === 0) break;
          let nextX = x1 - fx1 * ((x1 - x0) / (fx1 - fx0));
          x0 = x1;
          x1 = nextX;
        }
        return 'No convergió o no es lineal';
      } else {
        // Just an expression
        return math.format(math.evaluate(textEquation), { precision: 14 });
      }
    } catch {
      return '';
    }
  },
  generateGraphData: (textEquation) => {
    if (!textEquation) return [];
    try {
      // We assume something like y = 2x+5 or just 2x+5
      const expressionStr = textEquation.includes('=') ? textEquation.split('=')[1] : textEquation;
      if (!expressionStr) return [];
      const parsed = math.parse(expressionStr);
      let data = [];
      for (let x = -10; x <= 10; x += 1) {
        const yVal = parsed.evaluate({ x: x });
        // Use Number() to convert BigNumber from mathjs to normal primitive for recharts
        data.push({ x: x, y: Number(yVal) });
      }
      return data;
    } catch {
      return [];
    }
  }
}

export const DateCalculatorLogic = {
  calculateDiff: (date1, date2) => {
    if (!date1 || !date2) return null;
    return differenceInDays(parseISO(date2), parseISO(date1));
  },
  addSomeDays: (date1, days) => {
    if (!date1 || isNaN(days)) return null;
    return format(addDays(parseISO(date1), Number(days)), 'yyyy-MM-dd');
  }
}
