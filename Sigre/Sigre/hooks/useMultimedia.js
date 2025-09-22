import { Alert } from 'react-native';
import { api } from '../api/apiConfig';
import axios from 'axios';

export const useMultimedia = () => {

    const upLoadFile = (file) => {
        // api().post('File/UploadFile', file)
        // .then(resp => {
        //     Alert.alert('Se guardó el archivo correctamente.');
        // })
        // .catch((error) => console.error(error));

        axios({
            method: "post",
            url: 'https://sigreserver.azurewebsites.net/api/File/UploadFile',
            data: file,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
            .then(() => {
              Alert.alert("Se guardó el archivo correctamente.");
            })
            .catch((error) => {
              console.error(error);
            });
    }

    return{
        upLoadFile
    }
}