package io.lukerykta.service;

import io.lukerykta.entity.User;
import io.lukerykta.entity.UserVisitEvent;
import io.lukerykta.repository.UserRepository;
import io.lukerykta.repository.UserVisitEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserVisitService {

    private final UserRepository users;
    private final UserVisitEventRepository visits;

    @Transactional
    public void recordVisit(Long userId) {
        if (userId == null) {
            return;
        }

        User user = users.getReferenceById(userId);
        visits.save(new UserVisitEvent(user));
    }
}
