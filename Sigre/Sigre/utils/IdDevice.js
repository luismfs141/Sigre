import { useEffect } from 'react';
import * as Application from 'expo-application';
import { useDispatch } from 'react-redux';
import { setIdPhone, setUserMod } from '../context/actions/Actions';

export function useIdDevice() {
  const dispatch = useDispatch();

  useEffect(() => {
    const idPhone = Application.androidId;
    dispatch(setUserMod(idPhone));
    dispatch(setIdPhone(idPhone));
  }, []);
}