import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectCtrl } from "@app/global";

import { getChannels } from "@server/requests";

import useKeydown from "@hooks/useKeydown";

import HeadSearch from "./components/HeadSearch";
import ResultSearch from "./components/ResultSearch";

import "./styles/Search.scss";
import { getSearchResults } from "../../server/requests";

export default memo(function Search({
  type,
  setShow,
  setUrl,
  setPipMode = () => {},
}) {
  const ctrl = useSelector(selectCtrl);
  const refInp = useRef(null);

  const [control, setControl] = useState("keyboard");
  const [valueSearch, setValueSearch] = useState("");
  const [result, setResult] = useState([]);
  const [empty, setEmpty] = useState(false);
  const [contentSearchValue, setContentSearchValue] = useState("");
  const refContentInp = useRef(null);
  const resultSearch = useMemo(() => result.map((item) => item), [result]);

  const getResultChannels = async () => {
    setEmpty(false);

    const response = await getChannels({
      query: JSON.stringify({
        pagination: false,
        search_and: { name: valueSearch },
        sort: ["position", "ASC"],
      }),
    });
    const parsedResponse = JSON.parse(response);
    const { error, message } = parsedResponse;

    if (!error) {
      if (message.length > 0) setResult(message.slice(0, 10));
      else setEmpty(true);
    } else {
      setEmpty(true);
    }
  };

  const getResultContent = async (value) => {
    try {
      const response = await getSearchResults({ search: value });

      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;

      if (!error) {
        const moviesSeries = [
          ...message.movies[0].content,
          ...message.tv_shows[0].content,
        ];
        if (moviesSeries.length) {
          setResult(moviesSeries.slice(0, 10));
        } else {
          setEmpty(true);
        }
      } else {
        setEmpty(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (refInp.current && type === "live") {
      refInp.current.focus();
    }
  }, []);

  useEffect(() => {
    if (refContentInp.current && type === "content") {
      refContentInp.current.focus();
    }
  }, []);

  useEffect(() => {
    let timer = null;

    timer = setTimeout(() => {
      if (type === "live") getResultChannels();
    }, 500);

    return () => clearTimeout(timer);
  }, [valueSearch]);

  useEffect(() => {
    let timer = null;

    timer = setTimeout(() => {
      if (contentSearchValue) {
        getResultContent(contentSearchValue);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [contentSearchValue]);

  const handleSearch = (e) => {
    setValueSearch(e.target.value);
  };

  const handleContentSearch = (e) => {
    setContentSearchValue(e.target.value);
  };

  const setRemove = () => {
    if (type === "live") {
      setValueSearch(valueSearch.slice(0, -1));
    } else if (type === "content") {
      setContentSearchValue(contentSearchValue.slice(0, -1));
    }
  };

  useKeydown({
    // isActive: control === "keyboard" && ctrl === "moviesSearchKeyboard",
    isActive: control === "keyboard",

    // back: () => {
    //   if (type === "live") {
    //     refInp.current.blur();
    //   } else if (type === "content") {
    //     refContentInp.current.blur();
    //   }
    // },
    ok: () => {
      if (type === "live") {
        refInp.current.blur();
      } else if (type === "content") {
        refContentInp.current.blur();
      }
    },

    handleKeyPress: (key) => {
      if (["Backspace", "Delete"].includes(key)) return setRemove();

      if (/^[a-zA-Z]$/.test(key)) {
        if (type === "live") {
          setValueSearch(valueSearch + key);
        } else if (type === "content") {
          setContentSearchValue(contentSearchValue + key);
        }
      }
    },
  });

  return (
    <div className="parent-search">
      <HeadSearch />
      {type === "live" ? (
        <input
          type="text"
          ref={refInp}
          className={`search-inp`}
          onChange={handleSearch}
          value={valueSearch}
          placeholder="Search"
          onBlur={() => setControl("result")}
          onFocus={() => setControl("keyboard")}
        />
      ) : (
        <input
          type="text"
          ref={refContentInp}
          className={`search-inp`}
          onChange={handleContentSearch}
          value={contentSearchValue}
          placeholder="Search"
          onBlur={() => setControl("result")}
          onFocus={() => setControl("keyboard")}
        />
      )}

      <ResultSearch
        empty={empty}
        refInp={refInp}
        setShow={setShow}
        result={resultSearch}
        setPipMode={setPipMode}
        type={type}
        setUrl={setUrl}
        setRemove={setRemove}
        setControl={setControl}
        control={control === "result"}
      />
    </div>
  );
});
