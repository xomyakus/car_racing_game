import { createContext, useContext } from 'react';

/** Opens the track tour, with the saved brain under `brainKey` already picked when given. */
export const TourCtx = createContext<(brainKey?: string) => void>(() => {});
export const useOpenTour = () => useContext(TourCtx);
