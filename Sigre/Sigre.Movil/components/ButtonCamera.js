import * as React from 'react';
import { Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function Button({ title, onPress, ruta}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Image source={require(ruta)}/>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#f1f1f1',
    marginLeft: 10,
  },
});