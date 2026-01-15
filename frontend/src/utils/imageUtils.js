/**
 * Helper function to generate safe image URLs
 * Strictly uses Cloudinary URLs from the 'path' property or string
 */
export const getImageUrl = (image) => {
  if (!image) return 'https://placehold.co/400x300?text=No+Image';

  // Strictly String (Cloudinary URL or Data URI)
  if (typeof image === 'string') {
    // Return as-is if it looks like a valid URL or data URI
    return image;
  }

  // Fallback for invalid types
  return 'https://placehold.co/400x300?text=Invalid+Image';
};

/**
 * Helper to get profile image URL
 */
export const getProfileImageUrl = (profilePic) => {
  if (!profilePic) return "https://randomuser.me/api/portraits/men/1.jpg";

  // Strictly String
  if (typeof profilePic === "string") {
    return profilePic;
  }

  return "https://randomuser.me/api/portraits/men/1.jpg";
};
