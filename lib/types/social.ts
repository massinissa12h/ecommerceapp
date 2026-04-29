// Shared types for the friends + chat feature

export type FriendshipStatus = 'pending' | 'accepted'

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
}

export interface PublicUser {
  id: string
  username: string | null
  email: string | null
  avatar_url?: string | null
}

export interface ProductShareMetadata {
  type: 'product_share'
  product_id: string
  name: string
  price: number | null
  image_url: string | null
}

export type MessageMetadata = ProductShareMetadata | Record<string, unknown> | null

// Friendship row joined with the *other* user (the one you're not).
// `direction` tells you whether you sent (outgoing) or received (incoming) the request.
export interface FriendshipWithUser extends Friendship {
  other: PublicUser
  direction: 'incoming' | 'outgoing'
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
  read_at: string | null
  metadata?: MessageMetadata
}
