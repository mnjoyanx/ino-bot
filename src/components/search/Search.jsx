import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { selectCtrl } from "@app/global";
import { useTranslation } from "react-i18next";

import { getChannels, getSearchResults } from "@server/requests";

import useKeydown from "@hooks/useKeydown";

import HeadSearch from "./components/HeadSearch";
import ResultSearch from "./components/ResultSearch";

import "./styles/Search.scss";
import { setCtrl } from "@app/global";

export default memo(function Search({
  type,
  setShow,
  setUrl,
  setPipMode = () => {},
}) {
  const { t } = useTranslation();
  const ctrl = useSelector(selectCtrl);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const refInp = useRef(null);

  const [searchValue, setSearchValue] = useState("");
  const [control, setControl] = useState("keyboard");
  const [result, setResult] = useState([]);
  const [empty, setEmpty] = useState(false);
  const refContentInp = useRef(null);
  const resultSearch = useMemo(() => result.map((item) => item), [result]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("search");
    if (query) {
      setSearchValue(query);
      if (type === "live") {
        getResultChannels(query);
      } else {
        getResultContent(query);
      }
    }
  }, [location.search, type]);

  useEffect(() => {
    if (result.length === 0) {
      setEmpty(true);
    } else {
      setEmpty(false);
    }
  }, [result]);

  const getResultChannels = async (query) => {
    setEmpty(false);
    const response = await getChannels({
      query: JSON.stringify({
        pagination: false,
        search_and: { name: query },
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

  const getResultContent = async (query) => {
    try {
      const response = await getSearchResults({ search: query });
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;
      if (!error) {
        const moviesSeries = [
          ...message.movies[0].content,
          ...message.tv_shows[0].content,
        ];
        if (moviesSeries.length > 0) {
          setResult(moviesSeries.slice(0, 10));
          setEmpty(false);
        } else {
          setResult([]);
          setEmpty(true);
        }
      } else {
        setResult([]);
        setEmpty(true);
        console.error("Error fetching search results:", error);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let timer = null;
    if (searchValue) {
      timer = setTimeout(() => {
        if (type === "live") {
          getResultChannels(searchValue);
        } else {
          getResultContent(searchValue);
        }
      }, 500);
    } else {
      setResult([]);
      setEmpty(false);
    }
    return () => clearTimeout(timer);
  }, [searchValue, type]);

  useEffect(() => {
    if (refInp.current && type === "live") {
      refInp.current.focus();
    } else if (refContentInp.current && type === "content") {
      refContentInp.current.focus();
    }
  }, []);

  const handleSearch = (e) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    updateSearchQuery(newValue);
  };

  const updateSearchQuery = (query) => {
    const searchParams = new URLSearchParams(location.search);
    if (query) {
      searchParams.set("search", query);
    } else {
      searchParams.delete("search");
    }
    navigate(`${location.pathname}?${searchParams.toString()}`, {
      replace: true,
    });
  };

  const setRemove = () => {
    const newValue = searchValue.slice(0, -1);
    setSearchValue(newValue);
    updateSearchQuery(newValue);
  };

  useKeydown({
    // isActive: control === "keyboard",
    isActive: ctrl !== "result",
    // ok: () => {
    //   alert("ioj");
    //   if (type === "live") {
    //     refInp.current.blur();
    //   } else if (type === "content") {
    //     refContentInp.current.blur();
    //   }
    // },
    up: () => {
      if (type === "live") {
        if (ctrl === "inp") {
          refInp.current.blur();
          dispatch(setCtrl("backBtn"));
        } else if (ctrl === "result") {
          refInp.current.focus();
          dispatch(setCtrl("inp"));
        }
      } else if (type === "content") {
        if (ctrl === "inp") {
          dispatch(setCtrl("backBtn"));
          refContentInp.current.blur();
        } else if (ctrl === "result") {
          dispatch(setCtrl("inp"));
          refContentInp.current.focus();
        }
      }
    },
    down: () => {
      if (type === "live") {
        if (ctrl === "inp") {
          if (empty) return;
          refInp.current.blur();
          dispatch(setCtrl("result"));
        } else if (ctrl === "backBtn") {
          dispatch(setCtrl("inp"));
          refInp.current.focus();
        }
      } else if (type === "content") {
        if (ctrl === "inp") {
          if (empty) return;
          refContentInp.current.blur();
          dispatch(setCtrl("result"));
        } else if (ctrl === "backBtn") {
          dispatch(setCtrl("inp"));
          refContentInp.current.focus();
        }
      }
    },

    ok: () => {
      if (ctrl === "inp") {
        if (type === "live") {
          refInp.current?.blur();
        } else if (type === "content") {
          refContentInp.current?.blur();
        }

        if (empty) {
          dispatch(setCtrl("backBtn"));
        } else {
          dispatch(setCtrl("result"));
        }
      }
    },

    handleKeyPress: (key) => {
      if (ctrl !== "inp") return;

      if (["Backspace", "Delete"].includes(key)) return setRemove();

      if (/^[a-zA-Z]$/.test(key)) {
        const newValue = searchValue + key;
        setSearchValue(newValue);
        updateSearchQuery(newValue);
      }
    },

    back: () => {
      if (type === "live") {
        refInp.current.blur();
      } else if (type === "content") {
        refContentInp.current.blur();
      }

      dispatch(setCtrl("backBtn"));
    },
  });

  return (
    <div className="parent-search">
      <HeadSearch
        setShowSearchHandler={() => {
          setShow(false);
          updateSearchQuery("");
        }}
        setControl={setControl}
        control={control === "result"}
      />
      <input
        type="text"
        ref={type === "live" ? refInp : refContentInp}
        className={`search-inp`}
        onChange={handleSearch}
        value={searchValue}
        placeholder={t("Search")}
        onBlur={() => setControl("result")}
        onFocus={() => setControl("keyboard")}
      />
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
        onBackHandler={() => updateSearchQuery("")}
        ctrl={ctrl}
        control={
          control === "result" && !empty && ctrl !== "inp" && ctrl !== "backBtn"
        }
        changeCtrl={() => dispatch(setCtrl("inp"))}
      />
    </div>
  );
});
