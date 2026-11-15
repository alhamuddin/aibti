export function courseMaterialFolderName(name: string): string {
  const folderName = name
    .normalize("NFKC")
    .replace(/[\u0000-\u001f<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, 100)
    .trim()
    .replace(/[. ]+$/g, "");

  if (!folderName || folderName === "." || folderName === "..") return "untitled";
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(folderName)) {
    return `_${folderName}`;
  }
  return folderName;
}
