import { useEffect, useState, useRef } from 'react';

type Step = 'organisations' | 'create-organisation' | 'plan' | 'complete';

export function useStepTransition(step: Step) {
    const [displayStep, setDisplayStep] = useState<Step>(step);
    const [animState, setAnimState] = useState<'idle' | 'exit' | 'enter'>('idle');
    const prevStep = useRef<Step>(step);

    useEffect(() => {
        if (step === prevStep.current) return;
        setAnimState('exit');
        const t1 = setTimeout(() => {
            setDisplayStep(step);
            setAnimState('enter');
        }, 200);
        const t2 = setTimeout(() => {
            setAnimState('idle');
            prevStep.current = step;
        }, 420);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [step]);

    return { displayStep, animState };
}