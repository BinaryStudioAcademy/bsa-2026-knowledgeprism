import { useDispatch } from "react-redux";

import { type store } from "~/lib/store/store.js";

const useAppDispatch = useDispatch.withTypes<typeof store.instance.dispatch>();

export { useAppDispatch };
