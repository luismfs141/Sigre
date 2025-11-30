import { StyleSheet, View } from 'react-native';

const ElsContainer = ({ children }) => {
    return (
    <View style={styles.container}>
        {children}
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        
        backgroundColor: '#001B36'
    },
  });
  
  export default ElsContainer;