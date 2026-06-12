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

const PAPER = '#EDEAE1';
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

// one slab headline line, revealed with the site's slide-up + clip animation
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

// screenshot pinned to the board with the site's pin-drop spring
const PinnedCard: React.FC<{
  src: string;
  width: number;
  tilt: number;
  delay: number;
}> = ({src, width, tilt, delay}) => {
  const frame = useCurrentFrame();
  const {fps, width: vw} = useVideoConfig();
  const s = vw / 1080;
  const drop = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 130}});
  return (
    <div
      style={{
        position: 'relative',
        width,
        opacity: frame < delay ? 0 : 1,
        transform: `translateY(${(1 - drop) * -60 * s}px) rotate(${tilt}deg) scale(${0.92 + drop * 0.08})`,
      }}
    >
      <div
        style={{
          border: `${3 * s}px solid ${INK}`,
          boxShadow: `${8 * s}px ${8 * s}px 0 0 ${INK}`,
          background: '#fff',
          lineHeight: 0,
        }}
      >
        <Img src={src} style={{width: '100%'}} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: -14 * s,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <RedPin size={34 * s} />
      </div>
    </div>
  );
};

const SceneHook: React.FC = () => {
  const {width} = useVideoConfig();
  const s = width / 1080;
  return (
    <AbsoluteFill
      style={{
        background: PAPER,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30 * s,
      }}
    >
      <MonoLabel text="/ Fable community gallery /" size={22 * s} />
      <div style={{textAlign: 'center'}}>
        <SlabLine text="You made" delay={6} fontSize={170 * s} />
        <SlabLine text="something" delay={12} fontSize={170 * s} />
        <SlabLine text="with AI." delay={18} fontSize={170 * s} color={RED} />
      </div>
    </AbsoluteFill>
  );
};

const SceneProblem: React.FC = () => {
  const {width} = useVideoConfig();
  const s = width / 1080;
  return (
    <AbsoluteFill
      style={{background: INK, alignItems: 'center', justifyContent: 'center'}}
    >
      <div style={{textAlign: 'center'}}>
        <SlabLine text="Don't let it" delay={2} fontSize={150 * s} color={PAPER} />
        <SlabLine text="die in a" delay={8} fontSize={150 * s} color={PAPER} />
        <SlabLine text="chat log." delay={14} fontSize={150 * s} color={RED} />
      </div>
    </AbsoluteFill>
  );
};

const ScenePromise: React.FC = () => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const s = width / 1080;
  const barW = interpolate(frame, [34, 52], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });
  return (
    <AbsoluteFill
      style={{
        background: PAPER,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 44 * s,
      }}
    >
      <div style={{textAlign: 'center'}}>
        <SlabLine text="You upload" delay={4} fontSize={130 * s} />
        <SlabLine text="your creations." delay={10} fontSize={130 * s} />
      </div>
      <div style={{textAlign: 'center'}}>
        <SlabLine text="We drive" delay={22} fontSize={170 * s} color={RED} />
        <SlabLine text="the traffic." delay={28} fontSize={170 * s} color={RED} />
        <div
          style={{
            height: 14 * s,
            background: INK,
            width: `${barW}%`,
            marginTop: 18 * s,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const SceneProof: React.FC = () => {
  const {width, height} = useVideoConfig();
  const s = width / 1080;
  const portrait = height > width;
  return (
    <AbsoluteFill
      style={{
        background: PAPER,
        backgroundImage: `linear-gradient(90deg, rgba(20,19,16,0.08) 1px, transparent 1px), linear-gradient(rgba(20,19,16,0.08) 1px, transparent 1px)`,
        backgroundSize: `${44 * s}px ${44 * s}px`,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40 * s,
      }}
    >
      <MonoLabel text="Real projects. Real makers." size={24 * s} delay={0} />
      <div
        style={{
          display: 'flex',
          alignItems: portrait ? 'center' : 'flex-start',
          flexDirection: portrait ? 'column' : 'row',
          gap: 34 * s,
        }}
      >
        <PinnedCard
          src={staticFile('fable-home-desktop.png')}
          width={portrait ? width * 0.78 : 640 * s}
          tilt={-2.5}
          delay={6}
        />
        <PinnedCard
          src={staticFile('fable-home-mobile.png')}
          width={portrait ? width * 0.34 : 240 * s}
          tilt={3.5}
          delay={16}
        />
      </div>
    </AbsoluteFill>
  );
};

const SceneCta: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const s = width / 1080;
  const barIn = spring({frame: frame - 28, fps, config: {damping: 15, stiffness: 120}});
  const pinDrop = spring({frame: frame - 20, fps, config: {damping: 12, stiffness: 140}});
  return (
    <AbsoluteFill
      style={{
        background: PAPER,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36 * s,
      }}
    >
      <MonoLabel text="/ A community gallery /" size={22 * s} delay={2} />
      <div style={{textAlign: 'center', position: 'relative'}}>
        <SlabLine text="Made" delay={6} fontSize={210 * s} />
        <SlabLine text="with Fable" delay={12} fontSize={210 * s} />
        <div
          style={{
            position: 'absolute',
            top: -20 * s,
            right: -34 * s,
            opacity: frame < 20 ? 0 : 1,
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
          opacity: frame < 28 ? 0 : 1,
          boxShadow: `${7 * s}px ${7 * s}px 0 0 ${RED}`,
        }}
      >
        Submit a project →
      </div>
      <MonoLabel text="made-with-fable.onrender.com" size={22 * s} delay={40} />
    </AbsoluteFill>
  );
};

export const Ad: React.FC = () => {
  return (
    <AbsoluteFill style={{background: PAPER, fontFamily: archivo.fontFamily}}>
      <Sequence durationInFrames={78}>
        <SceneHook />
      </Sequence>
      <Sequence from={78} durationInFrames={70}>
        <SceneProblem />
      </Sequence>
      <Sequence from={148} durationInFrames={104}>
        <ScenePromise />
      </Sequence>
      <Sequence from={252} durationInFrames={100}>
        <SceneProof />
      </Sequence>
      <Sequence from={352}>
        <SceneCta />
      </Sequence>
      <Grain />
      <Frame />
    </AbsoluteFill>
  );
};
