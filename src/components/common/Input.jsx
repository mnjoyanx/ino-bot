import { memo } from "react";

const Input = (props) => {
  return (
    <>
      {props.label ? (
        <label className="auth_box_body_form_input_label">
          {props.label_title}
        </label>
      ) : null}
      <input
        max={props.max || 64}
        ref={props.refInp}
        className={`input ${props.className}`}
        onFocus={(e) => e.target.blur()}
        placeholder={props.placeholder}
        type={props.type}
        onClick={(e) => props.onClick(e)}
        onMouseEnter={() => props.onMouseEnter(props.index)}
      />
    </>
  );
};

export default memo(Input);
