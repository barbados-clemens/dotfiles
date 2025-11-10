Mix.install([:image])

defmodule ImgConvert do
  def main({opts, args, _invalid}) do
    args
    |> Enum.map(&Task.async(fn -> convert_to(opts, &1) end))
    |> Task.await_many()
  end

  def convert_to(options, file_path) do
    try do
      # Get the directory and filename without extension
      dir = Path.dirname(file_path)
      filename = Path.basename(file_path)
      base_name = Path.rootname(filename)

      ext =
        case options[:format] do
          nil ->
            ".avif"

          _ ->
            if String.starts_with?(options[:format], "."),
              do: options[:format],
              else: ".#{options[:format]}"
        end

      new_file_path = Path.join(dir, base_name <> ext)

      img = Image.open!(file_path)

      if(options[:exif]) do
        img
        |> Image.exif()
        |> case do
          {:ok, exif} -> IO.inspect(exif, label: "EXIF")
          {:error, reason} -> IO.puts("Error reading exif: #{inspect(reason)}")
          _ -> IO.puts("No exif data")
        end
      end

      if(options[:dry_run]) do
        IO.puts("[DRY RUN] Would converted #{filename} to #{Path.basename(new_file_path)}")
      else
        # Convert the image
        img
        |> Image.write!(new_file_path,
          strip_metadata: !options[:metadata],
          quality: 90,
          avif: [compression: :av1],
          heif: [compression: :hevc],
          webp: [effort: 8],
          png: [effort: 8]
        )

        original_file_size =
          File.stat!(file_path)
          |> format_bytes()

        converted_file_size =
          File.stat!(new_file_path)
          |> format_bytes()

        IO.puts(
          "✅ #{filename} (#{original_file_size}) -> #{Path.basename(new_file_path)} (#{converted_file_size})"
        )
      end
    rescue
      e ->
        IO.puts("Error converting #{file_path}: #{inspect(e)}")
    after
      if options[:remove] do
        File.rm(file_path)
      end
    end
  end

  defp format_bytes(%{:size => bytes}) when is_integer(bytes) do
    units = ["Bytes", "KiB", "MiB", "GiB"]
    i = floor(:math.log(bytes) / :math.log(1024))

    "#{round(bytes / :math.pow(1024, i))} #{Enum.at(units, i)}"
  end
end

options = [
  switches: [
    metadata: :boolean,
    format: :string,
    dry_run: :boolean,
    remove: :boolean,
    exif: :boolean
  ],
  aliases: [
    m: :metadata,
    f: :format,
    d: :dry_run,
    rm: :remove,
    e: :exif
  ]
]

System.argv()
|> OptionParser.parse(options)
|> ImgConvert.main()
