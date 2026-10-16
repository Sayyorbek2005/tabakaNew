import Icon from "./Icon";
import "./EmptyState.css";

export default function EmptyState({
  title,
  text,
  action,
  onAction,
  icon = "products",
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={28} />
      </div>

      <h3>{title}</h3>
      <p>{text}</p>

      {action && (
        <button className="button" onClick={onAction}>
          <Icon name="plus" />
          {action}
        </button>
      )}
    </div>
  );
}