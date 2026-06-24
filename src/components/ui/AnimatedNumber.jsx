import CountUp from 'react-countup';

export default function AnimatedNumber({ value, suffix = '', prefix = '', duration = 1.2 }) {
  return (
    <CountUp end={value || 0} duration={duration} separator="," suffix={suffix} prefix={prefix} preserveValue />
  );
}
