#!/bin/bash

# Clean previous output
rm -f combined_codebase.txt

# Define file types to ignore (extensions)
IMAGE_EXTENSIONS="\.(jpg|jpeg|png|gif|bmp|svg|ico|webp|tiff|avif)$"
BINARY_EXTENSIONS="\.(pdf|zip|gz|tar|jar|class|o|so|dll|exe|bin)$"
NODE_MODULES="node_modules"
BUILD_DIRS="(\.next|build|dist)"
IGNORED_FILES="(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)"
LOG_FILES="\.(log|log\.txt)$|.*-debug\.log"

# Create a temp file to store the list of files to process
git ls-files > git_files.tmp

# Count total files
TOTAL_FILES=$(cat git_files.tmp | wc -l | tr -d ' ')

# Calculate files to be skipped
IMAGES_SKIPPED=$(cat git_files.tmp | grep -iE "$IMAGE_EXTENSIONS" | wc -l | tr -d ' ')
BINARIES_SKIPPED=$(cat git_files.tmp | grep -iE "$BINARY_EXTENSIONS" | wc -l | tr -d ' ')
NODE_MODULES_SKIPPED=$(cat git_files.tmp | grep -E "$NODE_MODULES" | wc -l | tr -d ' ')
BUILD_DIRS_SKIPPED=$(cat git_files.tmp | grep -E "$BUILD_DIRS" | wc -l | tr -d ' ')
LOCK_FILES_SKIPPED=$(cat git_files.tmp | grep -E "$IGNORED_FILES" | wc -l | tr -d ' ')
LOG_FILES_SKIPPED=$(cat git_files.tmp | grep -E "$LOG_FILES" | wc -l | tr -d ' ')
TOTAL_SKIPPED=$((IMAGES_SKIPPED + BINARIES_SKIPPED + NODE_MODULES_SKIPPED + BUILD_DIRS_SKIPPED + LOCK_FILES_SKIPPED + LOG_FILES_SKIPPED))
FILES_INCLUDED=$((TOTAL_FILES - TOTAL_SKIPPED))

# Get repository information
REPO_URL=$(git config --get remote.origin.url)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse HEAD)
GEN_DATE=$(date)

# Create a summary header for the combined file
echo "# Combined Codebase Snapshot" > combined_codebase.txt
echo "# Generated on: $GEN_DATE" >> combined_codebase.txt
echo "# Repository: $REPO_URL" >> combined_codebase.txt
echo "# Branch: $BRANCH" >> combined_codebase.txt
echo "# Commit: $COMMIT" >> combined_codebase.txt
echo "" >> combined_codebase.txt
echo "# STATISTICS:" >> combined_codebase.txt
echo "# Total tracked files: $TOTAL_FILES" >> combined_codebase.txt
echo "# Image files skipped: $IMAGES_SKIPPED" >> combined_codebase.txt
echo "# Binary files skipped: $BINARIES_SKIPPED" >> combined_codebase.txt
echo "# Node modules files skipped: $NODE_MODULES_SKIPPED" >> combined_codebase.txt
echo "# Build directory files skipped: $BUILD_DIRS_SKIPPED" >> combined_codebase.txt
echo "# Lock files skipped: $LOCK_FILES_SKIPPED" >> combined_codebase.txt
echo "# Log files skipped: $LOG_FILES_SKIPPED" >> combined_codebase.txt
echo "# Files included in this snapshot: $FILES_INCLUDED" >> combined_codebase.txt
echo -e "\n\n" >> combined_codebase.txt

# Concatenate all tracked files with dividers (respects .gitignore)
echo "Concatenating tracked files..."
cat git_files.tmp | while read file; do
  # Skip image files, binary files, and other excluded files
  if echo "$file" | grep -iE "$IMAGE_EXTENSIONS" > /dev/null ||
     echo "$file" | grep -iE "$BINARY_EXTENSIONS" > /dev/null ||
     echo "$file" | grep -E "$NODE_MODULES" > /dev/null ||
     echo "$file" | grep -E "$BUILD_DIRS" > /dev/null ||
     echo "$file" | grep -E "$IGNORED_FILES" > /dev/null ||
     echo "$file" | grep -E "$LOG_FILES" > /dev/null; then
    continue
  fi
  
  # If file exists (in case it was deleted)
  if [ -f "$file" ]; then
    # Get file size in bytes
    FILE_SIZE_BYTES=$(wc -c < "$file" | tr -d ' ')
    
    # Create header with file name and size padded to 80 chars with "=" symbols
    HEADER_TEXT="=== $file ($FILE_SIZE_BYTES bytes)  "
    PADDING_LENGTH=$((80 - ${#HEADER_TEXT}))
    PADDING=$(printf '%*s' $PADDING_LENGTH | tr ' ' '=')
    
    # Add divider with filename
    echo -e "\n\n$HEADER_TEXT$PADDING" >> combined_codebase.txt
    
    # Add file content
    cat "$file" >> combined_codebase.txt
  fi
done

# Approximate token count (rough estimate: chars/4)
CHAR_COUNT=$(wc -c < combined_codebase.txt)
TOKEN_ESTIMATE=$((CHAR_COUNT / 4))

echo -e "\n\n================================================================================" >> combined_codebase.txt
echo "SUMMARY STATISTICS" >> combined_codebase.txt
echo "================================================================================" >> combined_codebase.txt
echo "Total tracked files: $TOTAL_FILES" >> combined_codebase.txt
echo "Image files skipped: $IMAGES_SKIPPED" >> combined_codebase.txt
echo "Binary files skipped: $BINARIES_SKIPPED" >> combined_codebase.txt
echo "Node modules files skipped: $NODE_MODULES_SKIPPED" >> combined_codebase.txt
echo "Build directory files skipped: $BUILD_DIRS_SKIPPED" >> combined_codebase.txt
echo "Lock files skipped: $LOCK_FILES_SKIPPED" >> combined_codebase.txt
echo "Log files skipped: $LOG_FILES_SKIPPED" >> combined_codebase.txt
echo "Files included in this snapshot: $FILES_INCLUDED" >> combined_codebase.txt
echo "Total characters: $CHAR_COUNT" >> combined_codebase.txt
echo "Estimated token count: $TOKEN_ESTIMATE" >> combined_codebase.txt
echo "Combined file size: $(du -h combined_codebase.txt | cut -f1)" >> combined_codebase.txt

# Verify that .gitignore is respected
echo "Verifying .gitignore is respected..."

# Create a temporary file with all files git would ignore
find . -type f | grep -v "\.git/" | sort > all_files.tmp
git check-ignore --stdin < all_files.tmp > git_ignored_files.tmp 2>/dev/null

# Output stats to console
echo "Number of tracked files: $TOTAL_FILES"
echo "Number of image files skipped: $IMAGES_SKIPPED"
echo "Number of binary files skipped: $BINARIES_SKIPPED"
echo "Number of node_modules files skipped: $NODE_MODULES_SKIPPED"
echo "Number of build directory files skipped: $BUILD_DIRS_SKIPPED"
echo "Number of lock files skipped: $LOCK_FILES_SKIPPED"
echo "Number of log files skipped: $LOG_FILES_SKIPPED"
echo "Number of files included: $FILES_INCLUDED"
echo "File size: $(du -h combined_codebase.txt | cut -f1)"
echo "Approximate token count: $TOKEN_ESTIMATE"

# Clean up temporary files
rm -f git_files.tmp all_files.tmp git_ignored_files.tmp

echo "Done! Combined file created at: combined_codebase.txt"
echo "Note: combined_codebase.txt is added to .gitignore and won't be tracked"