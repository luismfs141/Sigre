// const initialState = {
//   selectedFeeder: null,
//   selectedPin: null,
//   pins: [],
// };

// export default function AppReducer(state = initialState, action) {
//   switch (action.type) {
//     case "SET_SELECTED_FEEDER":
//       return { ...state, selectedFeeder: action.payload };

//     case "SET_PINS":
//       return { ...state, pins: action.payload };

//     case "SET_SELECTED_PIN":
//       return { ...state, selectedPin: action.payload };

//     default:
//       return state;
//   }
// }


const initialState = {
  selectedFeeder: null,
  selectedPin: null,
  pins: [],

  // ✅ NUEVO (no afecta lo existente)
  isLoading: false,
  isLoadingMessage: "",
};

export default function AppReducer(state = initialState, action) {
  switch (action.type) {
    case "SET_SELECTED_FEEDER":
      return { ...state, selectedFeeder: action.payload };

    case "SET_PINS":
      return { ...state, pins: action.payload };

    case "SET_SELECTED_PIN":
      return { ...state, selectedPin: action.payload };

    // ✅ NUEVO (solo para tu Loading global)
    case "APP/SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "APP/SET_LOADING_MESSAGE":
      return { ...state, isLoadingMessage: action.payload };

    default:
      return state;
  }
}
