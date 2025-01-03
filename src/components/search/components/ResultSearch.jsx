import { memo, useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentChannel } from "@app/channels/channelsSlice";
import { channelInfo } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";

// import ListView from "ino-listview";
import { ListView } from "@ino-ui/tv";
import CardChannel from "../../cards/CardChannel";
import MovieCard from "../../../pages/movies/components/MovieCard";
import { setCtrl } from "../../../app/global";
import { useTranslation } from "react-i18next";

export default memo(function ResultSearch({
  result,
  type,
  control,
  setRemove,
  changeCtrl,
  onBackHandler,
  setShow,
  setUrl,
  refInp,
  setPipMode,
  empty,
  ctrl,
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [active, setActive] = useState(0);

  const selectChannel = async (id) => {
    const response = await channelInfo({ id: id });
    const parsedResponse = JSON.parse(response);
    const { error, message } = parsedResponse;

    if (!error) {
      if (!message?.id_protected) {
        LOCAL_STORAGE.LAST_CHANNEL_ID.SET(id);
      }
      dispatch(setCurrentChannel(message));
      setUrl(message.url);
      setShow(false);
      if (setPipMode) {
        setPipMode(false);
      }
      window.PLAYER.setPositionPlayer(1920, 1080, 0, 0);
    }
  };

  const renderItem = ({ item, index, isActive, style }) => {
    return type === "live" ? (
      <CardChannel
        key={item.id}
        id={item.id}
        image={item.image}
        isActive={isActive}
        index={index}
        onClick={() => {
          selectChannel(item.id);
        }}
        style={style}
      />
    ) : (
      <MovieCard
        key={item.id}
        style={style}
        name={item.name}
        poster={item.poster}
        id={item.id}
        isActive={isActive}
      />
    );
  };

  return (
    <div className="parent-result">
      {empty ? (
        <div className="empty-result">
          <p>{t("No result found")}</p>
        </div>
      ) : (
        <ListView
          id="search-results"
          uniqueKey="search-result-"
          listType="horizontal"
          nativeControle={control}
          itemsCount={5}
          itemsTotal={result.length}
          buffer={2}
          debounce={300}
          gap={2}
          itemWidth={type === "live" ? 18 : 21}
          itemHeight={type === "live" ? 18 : 30}
          isActive={control && !empty}
          initialActiveIndex={0}
          onUp={() => {
            refInp.current.focus();
            changeCtrl();
          }}
          onBack={() => {
            setShow(false);

            if (type === "content") {
              dispatch(setCtrl("moviesSeries"));
            }
          }}
          renderItem={renderItem}
          data={result}
          onIndexChange={(index) => {
            console.log(index, "index");
            setActive(index);
          }}
          onOk={() => {
            if (!empty) {
              selectChannel(result[active].id, active);
            } else {
              refInp.current.focus();
            }
          }}
        />
      )}
    </div>
  );
});
