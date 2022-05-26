import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // localStorage.setItem("@RocketShoes:cart", JSON.stringify([]));
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [cart];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseProduct = await api
        .get(`/products/${productId}`)
        .catch(() => {
          throw new Error("Erro na adição do produto");
        });
      const responseStock = await api.get(`/stock/${productId}`).catch(() => {
        throw new Error("Quantidade solicitada fora de estoque");
      });

      const product = responseProduct ? responseProduct.data : [];
      const stock = responseStock ? responseStock.data : [];

      const getProducts = localStorage.getItem("@RocketShoes:cart");

      const products: Product[] = getProducts ? JSON.parse(getProducts) : [];
      const productInCart = products.find((p) => p.id === productId);

      if (productInCart) {
        if (productInCart.amount >= stock.amount) {
          throw new Error("Quantidade solicitada fora de estoque");
        }
      }

      if (stock.amount <= 0) {
        throw new Error("Quantidade solicitada fora de estoque");
      }

      if (productInCart) {
        const newCart: Product[] = cart.map((p) =>
          p.id === productId ? { ...p, amount: p.amount + 1 } : p
        );

        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));

        toast.success("Produto adicionado ao carrinho");
      } else {
        const newProduct: Product = {
          ...product,
          amount: 1,
        };
        const newCart: Product[] = [...cart, newProduct];

        setCart(newCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        toast.success("Produto adicionado ao carrinho");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const produtoExists = cart.find((p) => p.id === productId);

      if (produtoExists) {
        const newCart = cart.filter((p) => p.id !== productId);
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        toast.success("Produto removido com sucesso");
      } else {
        throw new Error("Erro na remoção do produto");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const responseStock = await api.get(`/stock/${productId}`).catch(() => {
        throw new Error("Quantidade solicitada fora de estoque");
      });

      const stock = responseStock ? responseStock.data : [];

      const getProducts = localStorage.getItem("@RocketShoes:cart");
      const products: Product[] = getProducts ? JSON.parse(getProducts) : [];

      const product = products.find((p) => p.id === productId);

      if (!product) {
        throw new Error("Erro na alteração de quantidade do produto");
      }

      if (amount > stock.amount || amount <= 0) {
        throw new Error("Quantidade solicitada fora de estoque");
      }

      if (amount < stock.amount && amount > 0) {
        const newCart = cart.map((p) =>
          p.id === productId ? { ...p, amount } : p
        );

        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        toast.success("Produto atualizado com sucesso");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
// should not be able to increase a product amount when running out of stock

// should not be able to update a product amount when running out of stock
