export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'customer'
  status: 'active' | 'banned'
  joinDate: string
  totalOrders: number
}

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@modernshop.com',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    joinDate: '2024-01-15',
    totalOrders: 0,
  },
  {
    id: '2',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'customer',
    status: 'active',
    joinDate: '2024-02-10',
    totalOrders: 5,
  },
  {
    id: '3',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    role: 'customer',
    status: 'active',
    joinDate: '2024-02-15',
    totalOrders: 12,
  },
  {
    id: '4',
    email: 'bob.wilson@example.com',
    name: 'Bob Wilson',
    role: 'customer',
    status: 'active',
    joinDate: '2024-03-01',
    totalOrders: 3,
  },
  {
    id: '5',
    email: 'alice.johnson@example.com',
    name: 'Alice Johnson',
    role: 'customer',
    status: 'banned',
    joinDate: '2024-03-10',
    totalOrders: 2,
  },
  {
    id: '6',
    email: 'charlie.brown@example.com',
    name: 'Charlie Brown',
    role: 'customer',
    status: 'active',
    joinDate: '2024-03-20',
    totalOrders: 8,
  },
  {
    id: '7',
    email: 'diana.prince@example.com',
    name: 'Diana Prince',
    role: 'customer',
    status: 'active',
    joinDate: '2024-04-01',
    totalOrders: 15,
  },
  {
    id: '8',
    email: 'evan.davis@example.com',
    name: 'Evan Davis',
    role: 'customer',
    status: 'active',
    joinDate: '2024-04-05',
    totalOrders: 1,
  },
]
