interface IAchievementHistoryProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function AchievementHistory(props: IAchievementHistoryProps) {
    return <div style={props.style} className={props.className}></div>
}