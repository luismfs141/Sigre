const initialState = {
  selectedFeeder: null,
  selectedPin: null,
  pins: [],
};

export default function AppReducer(state = initialState, action) {
  switch (action.type) {
    case "SET_SELECTED_FEEDER":
      return { ...state, selectedFeeder: action.payload };

    case "SET_PINS":
      return { ...state, pins: action.payload };

    case "SET_SELECTED_PIN":
      return { ...state, selectedPin: action.payload };

    default:
      return state;
  }
}
