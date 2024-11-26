import { useCallback, useEffect, useState } from "react";
import {
  launcherRegister,
  getlLauncherUser,
  loginUser,
} from "@server/requests.js";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectConfigs } from "@app/configs/configsSlice.js";

import LOCAL_STORAGE from "@utils/localStorage.js";
import PATHS from "@utils/paths";

import useKeydown from "@hooks/useKeydown";

import Loading from "@components/common/Loading.jsx";
import Button from "@components/common/Button";

import "@styles/components/activationPage.scss";

export default function ActivationPage() {
  const navigate = useNavigate();

  const configs = useSelector(selectConfigs);

  const [isLoading, setIsLoading] = useState(true);
  const [activationPageState, setActivationPageState] = useState();

  const checkDeviceMacAddress = async () => {
    const macAddress = LOCAL_STORAGE.MAC_ADDRESS.GET();

    setIsLoading(true);

    if (macAddress) {
      const user = await getlLauncherUser({
        device_id: macAddress,
      });
      const parsedUser = JSON.parse(user);
      const { message, error } = parsedUser;
      console.log(message, "message user");

      if (error) {
        setActivationPageState(message.action);
        if (message.action === "not_found") {
          registerLauncher();
        } else {
          setIsLoading(false);
        }
      } else {
        // need to login user
        loginUserReq();
      }
    }
  };

  const registerLauncher = async () => {
    const register = await launcherRegister({
      device_model: LOCAL_STORAGE.DEVICE_NAME.GET(),
      device_id: LOCAL_STORAGE.MAC_ADDRESS.GET(),
      device_type: LOCAL_STORAGE.DEVICE_MODEL.GET(),
      serial_number: LOCAL_STORAGE.DEVICE_MODEL.GET(),
    });
    const parsedRegister = JSON.parse(register);
    const { message, error } = parsedRegister;

    if (!error) checkDeviceMacAddress();
  };

  const loginUserReq = async () => {
    const token = await loginUser({
      device_id: LOCAL_STORAGE.MAC_ADDRESS.GET(),
    });

    const parsedToken = JSON.parse(token);
    const { message, error } = parsedToken;
    if (!error) {
      LOCAL_STORAGE.TOKEN.SET(message);
      navigate(PATHS.MENU);
    }
  };

  const checkAgain = useCallback(() => {
    checkDeviceMacAddress();
  }, []);

  useEffect(() => {
    checkDeviceMacAddress();
  }, []);

  useKeydown({ isActive: !isLoading, ok: checkAgain });

  return isLoading ? (
    <div className="loading-parent">
      <Loading />
    </div>
  ) : (
    <div className="activation-page-container">
      <div className="logo">
        <img
          src={configs?.basics?.logo || LOCAL_STORAGE.LOGO.GET()}
          alt="logo"
        />
      </div>
      <h3 className="title">DEVICE IS NOT ACTIVE</h3>
      <p className="device_id">MAC : {LOCAL_STORAGE.MAC_ADDRESS.GET()}</p>
      <Button
        index={0}
        onClick={checkAgain}
        onMouseEnter={() => {}}
        title={"Check Again"}
        isActive={true}
      />
    </div>
  );
}
