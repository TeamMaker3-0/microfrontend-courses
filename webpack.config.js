const HtmlWebpackPlugin = require("html-webpack-plugin");
      const { ModuleFederationPlugin } = require("webpack").container;
      const { dependencies } = require("./package.json");
      
      module.exports = {
        entry: "./src/entry",
        mode: "development",
        devServer: {
          port: 3014, // Modificar
        },
        module: {
          rules: [
            {
              test: /\.(ts|tsx)$/,
              exclude: /node_modules/,
              use: [
                {
                  loader: "babel-loader",
                  options: {
                    presets: [
                      "@babel/preset-env",
                      "@babel/preset-react",
                      "@babel/preset-typescript",
                    ],
                  },
                },
              ],
            },
            {
              test: /\.(js|jsx)$/,
              exclude: /node_modules/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: ["@babel/preset-env", "@babel/preset-react"],
                },
              },
            },
            {
              test: /\.css$/i,
              use: ["style-loader", "css-loader"],
            },
          ],
        },
        plugins: [
          new HtmlWebpackPlugin({
            template: "./public/index.html",
          }),
          new ModuleFederationPlugin({
            name: "courses_microfrontend", // Modificar
            filename: "remoteEntry.js",
            exposes: { // Ejemplo, aqui se exponen los componentes
              "./CreateCourseView": "./src/components/CreateCourseView",
              "./CourseInformationView": "./src/components/CourseInformationView",
            },
            shared: {
              ...dependencies,
              react: {
                singleton: true,
                requiredVersion: dependencies["react"],
              },
              "react-dom": {
                singleton: true,
                requiredVersion: dependencies["react-dom"],
              },
            },
          }),
        ],
        resolve: {
          extensions: [".tsx", ".ts", ".js", ".jsx"],
        },
        target: "web",
      };
      
      // Solo modificar las lineas que tienen comentarios