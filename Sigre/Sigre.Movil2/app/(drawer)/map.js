import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { AuthContext } from '../../context/AuthContext';
import { useOffline } from '../../hooks/useOffline'; // ajusta la ruta si es necesario

export default function Map() {
  const { signOut } = useContext(AuthContext);
  const { getTableData, setupDatabase, downloadData } = useOffline();
  const [postes, setPostes] = useState([]);

  const router = useRouter();

  const handleLogout = () => {
    signOut();
    router.replace('/');
  };

  useEffect(() => {
    const loadPostes = async () => {
      // 1. Inicializa la base si aún no se hizo
      await setupDatabase();

      // 2. Descarga datos del servidor si quieres actualizar
      await downloadData();

      // 3. Obtiene los postes de la base local
      const data = await getTableData('Postes');
      setPostes(data);
    };

    loadPostes();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -12.0464,
          longitude: -77.0428,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {postes.map((poste) => (
          <Marker
            key={poste.POSTE_Interno}
            coordinate={{
              latitude: poste.POSTE_Latitud,
              longitude: poste.POSTE_Longitud,
            }}
            title={poste.POSTE_Codigo}
            description={`ID: ${poste.POSTE_Interno}`}
          />
        ))}
      </MapView>
      <Button title="Cerrar sesión" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});