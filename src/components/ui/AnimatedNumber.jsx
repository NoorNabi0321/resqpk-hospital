import CountUpModule from 'react-countup';

// react-countup is CommonJS; some bundlers hand back the namespace object
// instead of the default export, so normalize it.
const CountUp = CountUpModule?.default ?? CountUpModule;

export default function AnimatedNumber({ value, suffix = '', prefix = '', duration = 1.2 }) {
  return (
    <CountUp end={value || 0} duration={duration} separator="," suffix={suffix} prefix={prefix} preserveValue />
  );
}
