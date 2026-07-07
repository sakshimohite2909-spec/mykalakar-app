export function normalizeArtistData(data: any) {
  if (!data) return null;

  return {
    ...data,
    media: {
      profilePhoto: data.media?.profilePhoto || data.profilePhoto || data.profilePicUrl || "",
      coverPhoto: data.media?.coverPhoto || data.coverPhoto || data.media?.profilePhoto || data.profilePhoto || data.profilePicUrl || "",
      galleryPhotos: data.media?.galleryPhotos || data.galleryPhotos || []
    },
    bankDetails: {
      bankName: data.bankDetails?.bankName || data.bankName || "",
      ifscCode: data.bankDetails?.ifscCode || data.ifscCode || "",
      accountNumber: data.bankDetails?.accountNumber || data.accountNumber || ""
    }
  };
}
