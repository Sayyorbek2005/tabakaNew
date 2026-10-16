import { useEffect, useId, useRef } from "react";
import Icon from "./Icon";
import "./Modal.css";

export default function Modal({ title, children, onClose }) {
  const dialog = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    element.showModal();

    return () => element.close();
  }, []);

  function backdropClick(event) {
    if (event.target !== dialog.current) return;

    const bounds = dialog.current.getBoundingClientRect();

    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby={titleId}
      onClick={backdropClick}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-header">
        <h2 id={titleId}>{title}</h2>

        <button
          type="button"
          className="icon-button"
          aria-label="Yopish"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>

      {children}
    </dialog>
  );
}