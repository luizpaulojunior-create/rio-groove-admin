import { useEffect, useState } from 'react';
import { ordersService } from '../services/orders';

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data =
          await ordersService.getOrders();

        setOrders(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, []);

  return (
    <div className="p-10 text-white">
      <h1 className="text-5xl mb-10">
        PEDIDOS
      </h1>

      <div className="space-y-4">
        {orders.map((order, index) => (
          <div
            key={order?.id || index}
            className="border border-zinc-800 p-4 rounded-xl"
          >
            <p>
              ID: {order?.id || '-'}
            </p>

            <p>
              Status:{' '}
              {order?.status || '-'}
            </p>

            <p>
              Total: R${' '}
              {Number(
                order?.total || 0
              ).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}