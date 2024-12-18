export default function FavActiveSvg({ onClick, isFill, isActive, onClick }) {
  return (
    // <svg
    //   width="2.8rem"
    //   height="3rem"
    //   viewBox="0 0 32 32"
    //   fill={isFill ? "#fff" : "none"}
    //   onClick={onClick}
    //   className="fav_active"
    // >
    //   <path
    //     d="M5.65366 16.334C5.12647 15.8103 4.70878 15.1869 4.42493 14.5002C4.14107 13.8135 3.99674 13.0771 4.00033 12.334C4.00033 10.8311 4.59735 9.38978 5.66005 8.32707C6.72276 7.26436 8.1641 6.66734 9.66699 6.66734C11.506 6.66734 13.1418 7.54114 14.1753 8.89848C14.4549 9.26576 14.872 9.52067 15.3336 9.52067V9.52067C15.7953 9.52067 16.2124 9.26571 16.4919 8.89823C16.9425 8.30578 17.5072 7.80613 18.1554 7.43024C19.0196 6.92903 20.0013 6.66579 21.0003 6.66734C22.5032 6.66734 23.9446 7.26436 25.0073 8.32707C26.07 9.38978 26.667 10.8311 26.667 12.334C26.667 13.894 26.0003 15.334 25.0137 16.334L15.3337 26.0007L5.65366 16.334ZM25.947 17.2807C27.2137 16.0007 28.0003 14.2673 28.0003 12.334C28.0003 10.4775 27.2628 8.69701 25.9501 7.38426C24.6373 6.07151 22.8568 5.33401 21.0003 5.33401C18.667 5.33401 16.6003 6.46734 15.3337 8.22734C14.6871 7.32934 13.8358 6.59843 12.8503 6.09525C11.8648 5.59206 10.7735 5.3311 9.66699 5.33401C7.81048 5.33401 6.03 6.07151 4.71724 7.38426C3.40449 8.69701 2.66699 10.4775 2.66699 12.334C2.66699 14.2673 3.45366 16.0007 4.72033 17.2807L14.9801 27.5405C15.1754 27.7357 15.492 27.7357 15.6872 27.5405L25.947 17.2807Z"
    //     fill={isActive ? "#0F87B2" : "#fff"}
    //   />
    // </svg>
    <svg
      viewBox="0 0 24 24"
      width="3.5rem"
      height="3.5rem"
      fill={isFill ? (isActive ? "#0F87B2" : "#fff") : "none"}
      className="fav_active"
      onClick={onClick}
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {" "}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z"
          stroke={isActive ? "#0F87B2" : "#fff"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>{" "}
      </g>
    </svg>
  );
}
