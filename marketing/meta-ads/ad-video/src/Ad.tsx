import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadArchivo} from '@remotion/google-fonts/Archivo';
import {loadFont as loadJetBrainsMono} from '@remotion/google-fonts/JetBrainsMono';

const anton = loadAnton('normal', {weights: ['400'], subsets: ['latin']});
const archivo = loadArchivo('normal', {weights: ['400', '700'], subsets: ['latin']});
const mono = loadJetBrainsMono('normal', {weights: ['400', '700'], subsets: ['latin']});

// matches the site's --color-background: oklch(0.94 0.011 86)
const PAPER = '#EDECE6';
const INK = '#141310';
const RED = '#D1232A';

const easeOutExpo = Easing.bezier(0.19, 1, 0.22, 1);

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

const Grain: React.FC = () => (
  <AbsoluteFill style={{backgroundImage: GRAIN, opacity: 0.045, pointerEvents: 'none'}} />
);

const Frame: React.FC<{color?: string}> = ({color = INK}) => {
  const {width} = useVideoConfig();
  const s = width / 1080;
  return (
    <AbsoluteFill
      style={{
        border: `${4 * s}px solid ${color}`,
        margin: 24 * s,
        width: `calc(100% - ${48 * s}px)`,
        height: `calc(100% - ${48 * s}px)`,
      }}
    />
  );
};

const SlabLine: React.FC<{
  text: string;
  delay: number;
  color?: string;
  fontSize: number;
}> = ({text, delay, color = INK, fontSize}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });
  return (
    <div style={{overflow: 'hidden'}}>
      <div
        style={{
          fontFamily: anton.fontFamily,
          fontSize,
          lineHeight: 0.92,
          textTransform: 'uppercase',
          color,
          transform: `translateY(${(1 - t) * 100}%)`,
          opacity: t,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  );
};

const MonoLabel: React.FC<{
  text: string;
  color?: string;
  delay?: number;
  size?: number;
}> = ({text, color = INK, delay = 0, size = 22}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        fontFamily: mono.fontFamily,
        fontSize: size,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color,
        opacity,
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
};

const RedPin: React.FC<{size: number}> = ({size}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 32% 30%, #ef5b54 0%, ${RED} 45%, #8f1217 100%)`,
      boxShadow: `${size * 0.09}px ${size * 0.09}px 0 0 ${INK}`,
      transform: 'rotate(-10deg)',
    }}
  />
);

// scene 1 — the surreal poster, slow push-in
const SceneHero: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1.04, 1.14], {
    easing: Easing.linear,
  });
  return (
    <AbsoluteFill style={{background: PAPER, alignItems: 'center', justifyContent: 'center'}}>
      <Img
        src={staticFile('hero-poster.png')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: `scale(${zoom})`,
        }}
      />
    </AbsoluteFill>
  );
};

const ScenePromise: React.FC = () => {
  const {width} = useVideoConfig();
  const s = width / 1080;
  return (
    <AbsoluteFill
      style={{background: INK, alignItems: 'center', justifyContent: 'center', gap: 40 * s}}
    >
      <div style={{textAlign: 'center'}}>
        <SlabLine text="You upload" delay={2} fontSize={140 * s} color={PAPER} />
        <SlabLine text="your creations." delay={8} fontSize={140 * s} color={PAPER} />
      </div>
      <div style={{textAlign: 'center'}}>
        <SlabLine text="We drive" delay={20} fontSize={170 * s} color={RED} />
        <SlabLine text="the traffic." delay={26} fontSize={170 * s} color={RED} />
      </div>
    </AbsoluteFill>
  );
};

// one step of the upload-process collage
const StepCard: React.FC<{
  src: string;
  step: string;
  label: string;
  tilt: number;
}> = ({src, step, label, tilt}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const s = width / 1080;
  const portrait = height > width;
  const drop = spring({frame, fps, config: {damping: 13, stiffness: 130}});
  const cardW = portrait ? width * 0.86 : width * 0.78;
  return (
    <AbsoluteFill
      style={{
        background: PAPER,
        backgroundImage: `linear-gradient(90deg, rgba(20,19,16,0.07) 1px, transparent 1px), linear-gradient(rgba(20,19,16,0.07) 1px, transparent 1px)`,
        backgroundSize: `${44 * s}px ${44 * s}px`,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36 * s,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: cardW,
          transform: `translateY(${(1 - drop) * -70 * s}px) rotate(${tilt}deg) scale(${0.92 + drop * 0.08})`,
        }}
      >
        <div
          style={{
            border: `${3 * s}px solid ${INK}`,
            boxShadow: `${9 * s}px ${9 * s}px 0 0 ${INK}`,
            background: '#fff',
            lineHeight: 0,
          }}
        >
          <Img src={src} style={{width: '100%'}} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: -16 * s,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <RedPin size={36 * s} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: -28 * s,
            left: -22 * s,
            background: RED,
            color: PAPER,
            fontFamily: anton.fontFamily,
            fontSize: 46 * s,
            padding: `${6 * s}px ${18 * s}px`,
            boxShadow: `${5 * s}px ${5 * s}px 0 0 ${INK}`,
            transform: 'rotate(-4deg)',
          }}
        >
          {step}
        </div>
      </div>
      <MonoLabel text={label} delay={6} size={28 * s} />
    </AbsoluteFill>
  );
};

const SceneCta: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const s = width / 1080;
  const barIn = spring({frame: frame - 24, fps, config: {damping: 15, stiffness: 120}});
  const pinDrop = spring({frame: frame - 16, fps, config: {damping: 12, stiffness: 140}});
  return (
    <AbsoluteFill
      style={{background: PAPER, alignItems: 'center', justifyContent: 'center', gap: 36 * s}}
    >
      <MonoLabel text="/ A community gallery /" size={22 * s} delay={2} />
      <div style={{textAlign: 'center', position: 'relative'}}>
        <SlabLine text="Made" delay={4} fontSize={210 * s} />
        <SlabLine text="with Fable" delay={10} fontSize={210 * s} />
        <div
          style={{
            position: 'absolute',
            top: -20 * s,
            right: -34 * s,
            opacity: frame < 16 ? 0 : 1,
            transform: `translateY(${(1 - pinDrop) * -50 * s}px)`,
          }}
        >
          <RedPin size={48 * s} />
        </div>
      </div>
      <div
        style={{
          background: INK,
          color: PAPER,
          fontFamily: mono.fontFamily,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontSize: 34 * s,
          fontWeight: 700,
          padding: `${22 * s}px ${44 * s}px`,
          transform: `scale(${0.6 + barIn * 0.4})`,
          opacity: frame < 24 ? 0 : 1,
          boxShadow: `${7 * s}px ${7 * s}px 0 0 ${RED}`,
        }}
      >
        Submit a project →
      </div>
      <MonoLabel text="madewithfable.com" size={26 * s} delay={34} color={RED} />
    </AbsoluteFill>
  );
};

export const Ad: React.FC = () => {
  return (
    <AbsoluteFill style={{background: PAPER, fontFamily: archivo.fontFamily}}>
      <Sequence durationInFrames={84}>
        <SceneHero />
      </Sequence>
      <Sequence from={84} durationInFrames={80}>
        <ScenePromise />
      </Sequence>
      <Sequence from={164} durationInFrames={50}>
        <StepCard
          src={staticFile('step1-filled.png')}
          step="01"
          label="Tell us what you made"
          tilt={-2}
        />
      </Sequence>
      <Sequence from={214} durationInFrames={50}>
        <StepCard
          src={staticFile('step2-media.png')}
          step="02"
          label="Pin your media"
          tilt={2.5}
        />
      </Sequence>
      <Sequence from={264} durationInFrames={50}>
        <StepCard
          src={staticFile('step4-review.png')}
          step="03"
          label="Submit for review"
          tilt={-2.5}
        />
      </Sequence>
      <Sequence from={314} durationInFrames={52}>
        <StepCard
          src={staticFile('project-detail.png')}
          step="04"
          label="Live on the board — we drive the traffic"
          tilt={2}
        />
      </Sequence>
      <Sequence from={366}>
        <SceneCta />
      </Sequence>
      <Grain />
      <Frame />
    </AbsoluteFill>
  );
};
