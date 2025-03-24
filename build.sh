#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status (error).

# Define paths
ROOT_DIR=$(git rev-parse --show-toplevel) # Automatically find the root directory of the git repo.
SERVER_DIR="$ROOT_DIR/services/rest-server"
CLIENT_DIR="$ROOT_DIR/app/react-client"
BUILD_DIR="$ROOT_DIR/build" # Directory in the root where we'll put the linked/copied artifacts

# Ensure the build directory exists
mkdir -p "$BUILD_DIR"

# Function to build a project and move or link artifacts
build_and_move() {
  local project_name="$1"        # e.g., "server" or "client"
  local project_dir="$2"         # e.g., "$SERVER_DIR" or "$CLIENT_DIR"
  local build_command="$3"       # e.g., "npm run build" or "mvn clean install"
  local source_dir="$4"          # e.g., "$project_dir/dist" or "$project_dir/target"
  local destination_dir="$5"     # e.g., "$BUILD_DIR/server" or "$BUILD_DIR/client"
  local link_or_copy="$6"      # "link" or "copy"

  echo "Building $project_name..."
  pushd "$project_dir"  # Change to the project directory
  $build_command
  popd # Return to the previous directory

  echo "Moving/Linking $project_name artifacts..."

  # Remove the old directory if it exists, avoiding errors with links.
  rm -rf "$destination_dir"

  if [ "$link_or_copy" == "link" ]; then
      # Create the directory if it doesn't exist
      mkdir -p "$(dirname "$destination_dir")"
      ln -s "$source_dir" "$destination_dir"
      echo "Created symbolic link from $source_dir to $destination_dir"
  elif [ "$link_or_copy" == "copy" ]; then
      mkdir -p "$(dirname "$destination_dir")"
      cp -r "$source_dir" "$destination_dir"
      echo "Copied from $source_dir to $destination_dir"
  else
      echo "Error:  link_or_copy must be 'link' or 'copy'"
      exit 1
  fi
}

# Build and link/copy the server
build_and_move "server" "$SERVER_DIR" "npm run build" "$SERVER_DIR/dist" "$BUILD_DIR/server" "link"

# Build and link/copy the client
build_and_move "client" "$CLIENT_DIR" "npm run build" "$CLIENT_DIR/dist" "$BUILD_DIR/client" "copy"

echo "Build and move/link complete!"
