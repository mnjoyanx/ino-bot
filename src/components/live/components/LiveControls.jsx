import Duration from "../../player/components/Duration";
import Progress from "../../player/components/Progress";

import "../styles/LiveControl.scss";

export default function LiveControls({ durationRef }) {
  return (
    <div className="live-control">
      <div className="number-channel"></div>
      <div className="logo">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIjDOkRFnfaY9S4kzuC5YmRVRSJjwrgCIyeg&s"
          alt=""
        />
      </div>
      <div className="name-channel">
        <p>name channel</p>
      </div>
      <div className="progress-field">
        <Progress percent={50} color="#FFFFFF" />
        <Duration durationRef={durationRef} />
      </div>
    </div>
  );
}
