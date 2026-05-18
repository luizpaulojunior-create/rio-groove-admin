import { useEffect } from 'react';
import { ordersService } from '../services/orders';

export default function Orders() {
  useEffect(() => {
    async function test() {
      try {
        const data =
          await ordersService.getOrders();

        console.log(data);
      } catch (err) {
        console.error(err);
      }
    }

    test();
  }, []);

  return (
    <div className="p-10 text-white text-5xl">
      TESTE ORDERS SERVICE
    </div>
  );
}