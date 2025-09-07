package io.lukerykta;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

import java.util.Arrays;

@Slf4j
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        try {
            ConfigurableApplicationContext context = SpringApplication.run(Application.class, args);
            Environment env = context.getEnvironment();
            log.debug("Active profiles: {}", Arrays.toString(env.getActiveProfiles()));
            log.debug("Server port: {}", env.getProperty("server.port"));
            log.info("lukerykta.io backend application has started successfully.");
        } catch (Throwable e) {
            if ("org.springframework.boot.devtools.restart.SilentExitExceptionHandler$SilentExitException"
                .equals(e.getClass().getName())) {
                throw e;                      // let DevTools trigger the restart
            }
            log.error("lukerykta.io backend application failed to start.", e);
        }
    }

}
