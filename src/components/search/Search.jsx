import { memo, useEffect, useMemo, useRef, useState } from "react";

import { getChannels } from "@server/requests";

import useKeydown from "@hooks/useKeydown";

import HeadSearch from "./components/HeadSearch";
import ResultSearch from "./components/ResultSearch";

import "./styles/Search.scss";

export default memo(function Search({ type, setShow, setUrl, setPipMode }) {
  const refInp = useRef(null);

  const [control, setControl] = useState("keyboard"); // result | keyboard
  const [valueSearch, setValueSearch] = useState("");
  const [result, setResult] = useState([]);
  const [empty, setEmpty] = useState(false);

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

  const getResultContent = () => {};

  useEffect(() => {
    if (refInp.current) {
      refInp.current.focus();
    }
  }, []);

  useEffect(() => {
    let timer = null;

    timer = setTimeout(() => {
      if (type === "live") getResultChannels();
      else if (type === "content") getResultContent();
    }, 500);

    return () => clearTimeout(timer);
  }, [valueSearch]);

  const handleSearch = (e) => {
    setValueSearch(e.target.value);
  };

  useKeydown({
    isActive: control === "keyboard",

    back: () => {
      refInp.current.blur();
    },
    ok: () => {
      refInp.current.blur();
    },
  });

  return (
    <div className="parent-search">
      <HeadSearch />
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
      <ResultSearch
        empty={empty}
        refInp={refInp}
        setShow={setShow}
        result={resultSearch}
        setPipMode={setPipMode}
        type={type}
        setUrl={setUrl}
        setControl={setControl}
        control={control === "result"}
      />
    </div>
  );
});
