declare global {
  const NDC_VERSION: string
  const NDC_CHANNEL: string
}

export const InstallationVersion = typeof NDC_VERSION === "string" ? NDC_VERSION : "local"
export const InstallationChannel = typeof NDC_CHANNEL === "string" ? NDC_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
