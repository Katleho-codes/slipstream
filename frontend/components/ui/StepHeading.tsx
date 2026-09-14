interface StepHeadingProps {
    eyebrow: string;
    title: string;
    subtitle: string;
}

export function StepHeading({ eyebrow, title, subtitle }: StepHeadingProps) {
    return (
        <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A9890', marginBottom: 8 }}>
                {eyebrow}
            </p>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 700, color: '#0D0D0D', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2 }}>
                {title}
            </h1>
            <p style={{ fontSize: 14, color: '#6B6860', lineHeight: 1.65 }}>{subtitle}</p>
        </div>
    );
}