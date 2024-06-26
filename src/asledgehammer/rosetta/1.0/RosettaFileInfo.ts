/**
 * **RosettaFileInfo** Stores file-specific information for {@link RosettaFile RosettaFiles}.
 *
 * @author Jab
 */
export type RosettaFileInfo = {
  /** The relative path from the patch folder. (Excludes 'json/yml') */
  uri: string;

  /** The type of file to save. */
  type: 'json' | 'yml';
};
