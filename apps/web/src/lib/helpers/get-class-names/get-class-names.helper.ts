import { type ClassValue, clsx } from "clsx";

const getClassNames = (...classes: ClassValue[]): string => {
	return clsx(...classes);
};

export { getClassNames };
