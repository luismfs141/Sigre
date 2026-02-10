// components/EstadoBadge.jsx

const EstadoBadge = ({ estado }) => {
  // Lógica de diseño según el valor (0 o 1)
  const esNoExiste = estado === 1; // 1 = No Existe / Tercero

  const estilo = {
    padding: '4px 12px',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    display: 'inline-block',
    // Condicional ternario para colores:
    backgroundColor: esNoExiste ? '#ffebee' : '#e8f5e9', // Fondo Rojo vs Verde suave
    color: esNoExiste ? '#c62828' : '#2e7d32',           // Texto Rojo vs Verde fuerte
    border: `1px solid ${esNoExiste ? '#ef9a9a' : '#a5d6a7'}`
  };

  return (
    <span style={estilo}>
      {esNoExiste ? 'NO EXISTE' : 'EXISTE'}
    </span>
  );
};

export default EstadoBadge;